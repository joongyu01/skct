// 사이트의 문제 코드(예: 창의수리-07-3f9k2)로 문제를 찾는다. 사용: node tools/find-question.js 창의수리-07-3f9k2
// 고정 문제(questions.js의 QUESTIONS, bank-data.js의 BANK)는 여기서 바로 찾아 출력한다.
// 자동 출제 문제는 매번 숫자가 바뀌어 저장소에 없으므로, 실제로 본 문제를 Supabase에서 꺼내는 SQL을 출력한다(고정 문제도 고른 답을 보려면 같은 SQL).
process.removeAllListeners('warning'); // node 26의 localStorage 실험 경고(store.js가 건드림)를 숨긴다
const fs = require('fs'), path = require('path');
const code = process.argv[2] || '';
const m = code.trim().match(/^(\S+?)-(\d{2})-([0-9a-z]{5})$/);
if (!m) { console.error('코드 형식: 영역-유형번호-키5자리 (예: 창의수리-07-3f9k2)'); process.exit(1); }
const [, area, , key] = m;

// 사이트와 같은 키 함수(keyOf)를 쓰려고 세 파일을 한 범위에서 읽는다. store.js의 브라우저 저장소 호출은 try/catch로 감싸져 있어 node에서도 돈다
const root = path.join(__dirname, '..');
const src = ['questions.js', 'bank-data.js', 'store.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
const mod = { exports: {} };
new Function('module', src + '\n;QUESTIONS.push(...BANK);module.exports = { QUESTIONS, keyOf };')(mod);
const { QUESTIONS, keyOf } = mod.exports;

const strip = s => String(s).replace(/<br>/g, '\n').replace(/<\/(p|tr)>/g, '\n').replace(/<\/t[hd]>/g, ' | ').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
// 유형 번호는 유형이 추가되면 밀릴 수 있어 영역과 키만 맞춘다
const hit = QUESTIONS.find(q => q.area === area && keyOf(q).startsWith(key));
if (hit) {
  console.log(`[고정 문제] ${hit.area} · ${hit.type || ''}\n${strip(hit.q)}\n`);
  hit.choices.forEach((c, j) => console.log(`${'①②③④⑤'[j]} ${strip(c)}${j === hit.answer ? '  ← 정답' : ''}`));
  console.log(`\n해설: ${strip(hit.explain)}\n(사이트는 고정 문제의 보기 순서를 열 때마다 섞는다. 사용자가 본 순서와 고른 답은 아래 SQL로 확인)`);
} else console.log('[저장소에 없음] 자동 출제 문제이거나 코드가 틀렸다. 아래 SQL로 서버에서 찾는다.');

const like = key.replace(/[^0-9a-z]/g, '') + '%';
console.log(`
-- Supabase 프로젝트 jgkgacuzpoxkjuxcrjxc에서 실행. body = 사용자가 본 문제(보기 순서 그대로) + mine(고른 답 0~4, -1 모르겠음). body가 없는 옛 기록은 q(틀린 문제만)
select ts, ok, sec, mode, coalesce(body, q) as question from public.skct_attempts where area = '${area.replace(/'/g, "''")}' and qkey like '${like}' order by ts desc limit 5;
-- AI 선생님과 나눈 대화가 있으면
select updated, mine, q, messages from public.skct_ai_chats where area = '${area.replace(/'/g, "''")}' and qkey like '${like}' order by updated desc limit 3;`);
