// AI 해설: 사이트에서 문제 하나와 질문을 받아 Claude 답을 글자 그대로 흘려 보낸다. GET은 남은 크레딧을 알려 준다.
// Claude API 키는 Supabase 함수 비밀값(ANTHROPIC_API_KEY)에만 있고 사이트 코드에는 없다.
// 배포: verify_jwt=false (사이트는 JWT가 아닌 publishable 키를 쓴다). 대신 로그인 토큰(x-skct-token), Origin, 하루 호출 상한으로 막는다.
import Anthropic from "npm:@anthropic-ai/sdk@1.14.0";

const ORIGINS = ["https://www.joongyu.co.kr", "https://joongyu.co.kr", "http://127.0.0.1:8765", "http://localhost:8765"];
const CAP = 150; // 하루(한국 시간) 호출 상한. 주소가 공개되어 있어 남이 반복 호출해도 비용이 여기서 멈춘다
const MODEL = "claude-opus-5-5";
const PRICE = { input: 4 / 1e6, output: 20 / 1e6 }; // claude-opus-5-5 달러/토큰
const NUM = "①②③④⑤";

// 학생 요청(11/28): 원론부터 말하지 말고 이 문제의 이 숫자를 보고 바로 답을 고르는 눈대중 지름길부터. 같은 유형도 보기 숫자에 따라 지름길이 달라지므로
// 그 판단을 시키고, 눈대중으로 안 갈릴 때만 계산기를 쓰게 한다
const SYSTEM = `너는 SK하이닉스 전임직(Maintenance/Operator) SKCT 인지검사를 며칠 앞둔 고졸 전형 학생의 과외 선생님이다. 실전은 문항당 언어표현 6초, 언어이해 21초, 창의수리 30초, 자료해석 30초라 정석 풀이로는 시간이 모자란다. 학생에게 필요한 것은 "이 문제의 이 숫자"를 보고 계산기 없이 눈대중으로 바로 답을 고르는 방법이다.

쓰기 전에 속으로 할 일(글로 쓰지 않는다):
1. 직접 풀어 정답을 확인한다. 사이트 정답이 틀렸으면 맨 앞에 그 사실과 근거를 말한다.
2. 보기 다섯 개를 먼저 보고, 이 숫자들에서 답이 가장 빨리 갈리는 눈대중 지름길을 고른다. 같은 유형이라도 숫자에 따라 지름길이 다르다. 예:
- 보기 끝자리(일의 자리나 끝 두 자리)가 모두 다르다: 끝자리만 계산한다.
- 보기끼리 차이가 크다(서로 10% 넘게): 앞 두 자리만 남기고 반올림해 어림한다.
- 짝홀, 5의 배수, 9의 배수(자릿수 합)처럼 성질로 갈린다: 그 성질 하나만 본다.
- 방정식·조건 문제: 보기를 조건에 넣어 본다(가운데 보기부터, 크면 작은 쪽으로).
- 크기 비교: 1, 절반, 100% 같은 기준값과 비교하거나 분수는 교차 곱.
- 언어 문제: 답을 정하는 단서 단어 하나와, 바로 지워지는 보기.
이 목록에 없어도 이 숫자에 가장 빠른 눈대중 방법을 쓴다.
3. 계산기는 마지막 수단이다. 보기가 촘촘해 어떤 눈대중으로도 갈리지 않을 때만 계산기를 쓰고, 그때는 누르는 순서를 가장 짧게 준다. 눈대중으로 갈리는 문제에 계산기 풀이를 덧붙이지 않는다.

쓰는 형식(인사말, 원론, 일반론 없이 바로):
1) 첫 줄에 답, 방법, 걸리는 시간을 한 줄로. 예: "③ 870. 보기 끝자리가 다 달라서 끝자리만 보면 5초." 계산기가 필요하면 예: "② 1,284. 보기가 10 차이라 눈대중으로는 안 갈려요. 계산기로 12초."
2) 이 문제 숫자로 그 방법을 따라 하는 과정. 한 줄에 한 단계, 3~5줄. 계산기를 쓸 때는 "계산기: 2060 − 190 − 540 − 460 =" 처럼 누르는 순서 그대로.
3) "숫자가 바뀌면:"으로 시작하는 한두 줄. 같은 유형인데 보기가 어떻게 생기면 이 방법이 안 통하고 무엇으로 바꾸는지(눈대중이 안 통하면 계산기로 넘어가는 기준 포함).
4) 학생이 고른 답이 틀렸으면 왜 그 보기를 골랐을지 한 줄.
정석 풀이는 학생이 물을 때만, 또는 눈대중만으로 확신이 안 설 때만 한두 줄 붙인다.

학생이 더 물으면 일반 원칙 목록을 늘어놓지 말고 이 문제의 숫자로 바로 답한다. "보통 어떻게 보냐"고 물어도 이 문제에 적용한 결과부터 말하고, 기준은 한두 줄로 붙인다.
실전 화면 계산기는 사칙연산과 루트만 되고 괄호가 없으며 누르는 순서대로 계산한다. 종이와 펜은 없고 화면 그림판만 있다.
이 문제나 SKCT 푸는 요령과 관계없는 요청은 한 문장으로 거절하고 이 문제로 돌아온다.
친근한 해요체로 짧게 쓴다. 마크다운 기호(#, *, **, 표)는 쓰지 않는다. 목록은 1. 2.처럼 숫자로 쓴다.`;

const str = (v: unknown, max: number) => typeof v === "string" && v.length <= max;

// 사이트가 보낸 값이 형식에 맞는지 본다. 남이 아무 글이나 길게 보내 비용을 키우지 못하게 길이도 자른다
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function valid(b: any) {
  const q = b?.q, ms = b?.messages, mine = b?.mine;
  return q && (b.chat == null || (typeof b.chat === "string" && UUID.test(b.chat))) && (b.qkey == null || str(b.qkey, 40)) && str(q.area ?? "", 40) && str(q.type ?? "", 60) && str(q.q, 12000) && str(q.explain ?? "", 4000) &&
    Array.isArray(q.choices) && q.choices.length === 5 && q.choices.every((c: unknown) => str(c, 600)) &&
    Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 5 &&
    (mine == null || (Number.isInteger(mine) && mine >= -1 && mine < 5)) &&
    Array.isArray(ms) && ms.length % 2 === 1 && ms.length <= 11 && // 사용자 질문으로 끝나고, 한 문제에 6번까지
    ms.every((m: any, i: number) => m?.role === (i % 2 ? "assistant" : "user") && str(m.content, i % 2 ? 8000 : 1000) && m.content.trim());
}

function errText(e: unknown) {
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) return "AI 해설 키가 올바르지 않습니다.";
  if (e instanceof Anthropic.RateLimitError) return "요청이 몰렸습니다. 잠시 뒤 다시 보내 주세요.";
  // 크레딧 부족은 전용 오류 종류가 없어 400 메시지로 구분한다
  if (e instanceof Anthropic.BadRequestError && /credit/i.test(e.message)) return "API 크레딧이 부족합니다.";
  return "AI 해설을 받지 못했습니다. 잠시 뒤 다시 보내 주세요.";
}

// DB 함수를 비밀 키로 부른다(skct_ai_take, skct_ai_spend, skct_ai_status는 비밀 키로만 부를 수 있다)
async function rpc(name: string, args: object) {
  const key = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${name} ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  if (!ORIGINS.includes(origin)) return new Response("forbidden", { status: 403 });
  const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "content-type, x-skct-token", "Access-Control-Allow-Methods": "GET, POST", Vary: "Origin" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const fail = (status: number, msg: string) => new Response(msg, { status, headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });

  // 사이트에 로그인한 기기만 쓴다: 로그인 때 받은 토큰을 DB에서 확인한다
  try {
    const token = req.headers.get("x-skct-token") ?? "";
    if (!token || token.length > 200 || !(await rpc("skct_token_ok", { t: token }))) return fail(401, "로그인이 필요해요. 페이지를 새로 고쳐 다시 로그인해 주세요.");
  } catch (e) {
    console.error(e);
    return fail(500, "로그인을 확인하지 못했어요.");
  }

  // ?chats: 저장된 AI 선생님 대화 목록(최근 것부터)
  if (req.method === "GET" && new URL(req.url).searchParams.has("chats")) {
    try {
      return new Response(JSON.stringify(await rpc("skct_ai_chat_list", { lim: 300 })), { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
    } catch (e) {
      console.error(e);
      return fail(500, "대화 기록을 불러오지 못했습니다.");
    }
  }
  // 남은 크레딧: 충전액(credit, 모르면 null) - 이 함수로 쓴 비용 합계(spent). 다른 곳에서 같은 키를 쓰면 그만큼 어긋난다
  if (req.method === "GET") {
    try {
      const s = await rpc("skct_ai_status", {});
      return new Response(JSON.stringify({ ...s, cap: CAP, ready: !!Deno.env.get("ANTHROPIC_API_KEY") }), { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
    } catch (e) {
      console.error(e);
      return fail(500, "사용량을 확인하지 못했습니다.");
    }
  }
  if (req.method !== "POST") return fail(405, "GET, POST만 받습니다.");

  let b;
  try {
    const raw = await req.text();
    if (raw.length > 60000) return fail(413, "질문이 너무 깁니다.");
    b = JSON.parse(raw);
  } catch {
    return fail(400, "요청 형식이 잘못되었습니다.");
  }
  if (!valid(b)) return fail(400, "요청 형식이 잘못되었습니다.");

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return fail(503, "AI 해설 키가 아직 등록되지 않았습니다.");

  try {
    if (!(await rpc("skct_ai_take", { cap: CAP }))) return fail(429, `오늘 AI 해설 사용 한도(${CAP}회)를 다 썼습니다. 내일 다시 써 주세요.`);
  } catch (e) {
    console.error(e);
    return fail(500, "사용량을 확인하지 못했습니다.");
  }

  const { q, mine } = b;
  const ctx = `[영역] ${q.area ?? ""} · ${q.type ?? ""}\n[문제]\n${q.q}\n[보기]\n${q.choices.map((c: string, j: number) => `${NUM[j]} ${c}`).join("\n")}\n` +
    `[사이트 정답] ${NUM[q.answer]}\n[사이트 해설] ${q.explain ?? "없음"}\n[학생이 고른 답] ${mine == null ? "고르지 않음" : mine < 0 ? "모르겠음" : NUM[mine]}`;
  const messages = b.messages.map((m: { role: "user" | "assistant"; content: string }, i: number) =>
    i ? m : { role: "user" as const, content: `${ctx}\n\n[질문]\n${m.content}` });

  const client = new Anthropic({ apiKey });
  const enc = new TextEncoder();
  let stream: ReturnType<typeof client.beta.messages.stream> | undefined;
  const body = new ReadableStream({
    async start(ctrl) {
      const put = (s: string) => { try { ctrl.enqueue(enc.encode(s)); } catch { /* 사용자가 화면을 떠남 */ } };
      try {
        stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: 8000, // 한 번 답의 비용 상한을 겸한다
          system: SYSTEM,
          messages,
          output_config: { effort: "medium" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default", // 안전 분류기가 거절하면 서버가 다른 모델로 다시 답한다
        });
        let text = "";
        stream.on("text", (t: string) => { text += t; put(t); });
        const final = await stream.finalMessage();
        // shortcut: 다른 모델로 넘어간 답도 opus 값으로 계산하고, 중간에 끊긴 답은 세지 않는다. 남은 금액이 실제와 어긋나면 콘솔 금액으로 credit을 다시 맞춘다
        await rpc("skct_ai_spend", { usd: final.usage.input_tokens * PRICE.input + final.usage.output_tokens * PRICE.output }).catch(console.error);
        if (final.stop_reason === "max_tokens") put("\n\n(답이 길어 여기서 끊겼습니다.)");
        if (final.stop_reason === "refusal") put("\n\n(이 질문에는 답하지 못했습니다. 다르게 물어봐 주세요.)");
        // 대화 기록: 사이트가 대화 id를 보냈고 답을 다 받았을 때만. 같은 대화의 다음 질문은 같은 행을 고친다
        else if (b.chat && text.trim()) {
          await rpc("skct_ai_log", {
            p_chat: b.chat, p_area: q.area ?? "", p_type: q.type ?? "", p_qkey: b.qkey ?? null,
            p_q: { q: q.q, choices: q.choices, answer: q.answer, explain: q.explain ?? "" }, p_mine: mine ?? null,
            p_messages: [...b.messages, { role: "assistant", content: text }],
          }).catch(console.error);
        }
      } catch (e) {
        if (!(e instanceof Anthropic.APIUserAbortError)) { console.error(e); put(`\n\n[오류] ${errText(e)}`); }
      }
      try { ctrl.close(); } catch { /* 이미 닫힘 */ }
    },
    cancel() { stream?.abort(); }, // 화면을 떠나면 생성을 멈춰 비용을 아낀다
  });
  return new Response(body, { headers: { ...cors, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
});
