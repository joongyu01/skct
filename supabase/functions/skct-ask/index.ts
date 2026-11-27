// AI 해설: 사이트에서 문제 하나와 질문을 받아 Claude 답을 글자 그대로 흘려 보낸다. GET은 남은 크레딧을 알려 준다.
// Claude API 키는 Supabase 함수 비밀값(ANTHROPIC_API_KEY)에만 있고 사이트 코드에는 없다.
// 배포: verify_jwt=false (사이트는 JWT가 아닌 publishable 키를 쓴다). 대신 Origin과 하루 호출 상한으로 막는다.
import Anthropic from "npm:@anthropic-ai/sdk@1.14.0";

const ORIGINS = ["https://www.joongyu.co.kr", "https://joongyu.co.kr", "http://127.0.0.1:8765", "http://localhost:8765"];
const CAP = 150; // 하루(한국 시간) 호출 상한. 주소가 공개되어 있어 남이 반복 호출해도 비용이 여기서 멈춘다
const MODEL = "claude-opus-5-5";
const PRICE = { input: 4 / 1e6, output: 20 / 1e6 }; // claude-opus-5-5 달러/토큰
const NUM = "①②③④⑤";

const SYSTEM = `너는 SK하이닉스 전임직(Maintenance/Operator) 채용 SKCT 인지검사를 준비하는 학생의 과외 선생님이다. 학생은 고졸 전형이고 시험이 며칠 남지 않았다.
- 첫 메시지에 붙은 한 문제를 두고 학생이 묻는 것에 답한다. 이 문제나 SKCT 푸는 요령과 관계없는 요청에는 한 문장으로 거절하고 이 문제로 돌아온다.
- 과외 선생님처럼 친근한 해요체로, 옆에서 같이 푸는 것처럼 설명한다. 정답만 알려 주지 말고 "문제를 보면 먼저 무엇을 보는지 → 어떻게 계산하거나 판단하는지 → 왜 그게 답인지" 순서로 푸는 방법을 가르친다.
- 학생이 고른 답이 틀렸으면 어디서 헷갈렸을지 짚어 주고, 맞았으면 더 빨리 푸는 길을 알려 준다.
- 실전에서 빨리 푸는 요령(어림셈, 끝자리 보기, 보기끼리 비교, 지우기)을 꼭 하나 넣는다. 실전 화면 계산기는 사칙연산과 루트만 되고 괄호가 없으며 누르는 순서대로 계산한다. 종이와 펜은 쓸 수 없고 화면 그림판만 있다.
- 실전 문항당 시간: 언어표현 6초, 언어이해 21초, 창의수리 30초, 자료해석 30초. 이 시간 안에 푸는 방법을 기준으로 가르친다.
- 마지막에 "비슷한 문제가 나오면 이렇게 하세요" 식으로 한 줄로 정리한다.
- 사이트 정답과 해설도 틀릴 수 있다. 설명하기 전에 직접 풀어 보고, 사이트 정답이 틀렸다고 판단되면 그 사실과 근거를 분명히 말한다.
- 짧게 쓴다. 계산은 한 줄에 한 단계씩 쓴다. 마크다운 기호(#, *, **, 표)를 쓰지 말고 일반 글로 쓴다. 목록이 필요하면 1. 2. 처럼 숫자를 쓴다.`;

const str = (v: unknown, max: number) => typeof v === "string" && v.length <= max;

// 사이트가 보낸 값이 형식에 맞는지 본다. 남이 아무 글이나 길게 보내 비용을 키우지 못하게 길이도 자른다
function valid(b: any) {
  const q = b?.q, ms = b?.messages, mine = b?.mine;
  return q && str(q.area ?? "", 40) && str(q.type ?? "", 60) && str(q.q, 12000) && str(q.explain ?? "", 4000) &&
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

// 비밀 키로만 부를 수 있는 DB 함수(skct_ai_take, skct_ai_spend, skct_ai_status)를 부른다
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
  const cors = { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST", Vary: "Origin" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const fail = (status: number, msg: string) => new Response(msg, { status, headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });

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
        stream.on("text", put);
        const final = await stream.finalMessage();
        // shortcut: 다른 모델로 넘어간 답도 opus 값으로 계산하고, 중간에 끊긴 답은 세지 않는다. 남은 금액이 실제와 어긋나면 콘솔 금액으로 credit을 다시 맞춘다
        await rpc("skct_ai_spend", { usd: final.usage.input_tokens * PRICE.input + final.usage.output_tokens * PRICE.output }).catch(console.error);
        if (final.stop_reason === "max_tokens") put("\n\n(답이 길어 여기서 끊겼습니다.)");
        if (final.stop_reason === "refusal") put("\n\n(이 질문에는 답하지 못했습니다. 다르게 물어봐 주세요.)");
      } catch (e) {
        if (!(e instanceof Anthropic.APIUserAbortError)) { console.error(e); put(`\n\n[오류] ${errText(e)}`); }
      }
      try { ctrl.close(); } catch { /* 이미 닫힘 */ }
    },
    cancel() { stream?.abort(); }, // 화면을 떠나면 생성을 멈춰 비용을 아낀다
  });
  return new Response(body, { headers: { ...cors, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
});
