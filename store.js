// 풀이 기록 저장소. 기록을 서버(Supabase)에 저장하고, 푼 문제를 기억해 같은 문제가 다시 나오지 않게 한다.
// 모든 기기가 같은 코드(SHARED)를 x-skct-code 헤더로 보내 같은 기록을 쓴다(자동 동기화). 서버는 RLS로 그 코드의 기록만 읽고 쓰게 한다.
// 서버가 안 되면 기록을 이 기기(outbox)에 두었다가 다음에 보낸다.
const API = 'https://jgkgacuzpoxkjuxcrjxc.supabase.co/rest/v1/skct_attempts';
const API_KEY = 'sb_publishable_dk1WP0IeCX01Vw9z89nmzQ_qPqG99PI'; // 브라우저에 두라고 만든 공개용 키
// shortcut: 코드가 이 파일에 공개돼 있어 사이트를 아는 사람은 누구나 이 기록을 읽고 쓰고 지울 수 있다. 다른 사람이 쓰기 시작하면 로그인으로 바꾼다
const SHARED = 'skct-shared-records-joongyu';
const ls = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }, // 사생활 보호 모드 등에서 저장이 막혀도 풀이는 계속
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); // 서버에서 온 글자를 화면에 넣을 때

// 문제 식별자: 문장과 정답이 같으면 같은 문제다. cyrb53 해시를 36진수로 줄인다
function hash(s) {
  let a = 0xdeadbeef, b = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); }
  a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
  b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
  return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36);
}
const keyOf = q => q._k ||= hash(q.q + '|' + q.choices[q.answer]);

// 서버에서 온 문제 내용은 누구나 쓸 수 있으므로 믿지 않는다. 문제에 쓰는 태그만 속성 없이 남기고 나머지는 글자로 바꾼다
const TAGS = new Set(['P', 'B', 'U', 'BR', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TH', 'TD']);
function clean(html) {
  const t = document.createElement('template');
  t.innerHTML = String(html);
  for (const el of [...t.content.querySelectorAll('*')].reverse()) { // 안쪽부터: 바깥 요소를 글자로 바꿔도 안쪽 처리가 끝난 뒤다
    if (!TAGS.has(el.tagName)) el.replaceWith(el.textContent);
    else for (const a of [...el.attributes]) el.removeAttribute(a.name);
  }
  return t.innerHTML;
}
// 오답 다시 풀기용 문제 객체. 모양이 틀리면 버린다
function revive(area, type, key, c) {
  if (!c || !AREAS.includes(area) || !Array.isArray(c.choices) || c.choices.length !== 5 || !Number.isInteger(c.answer) || c.answer < 0 || c.answer > 4) return null;
  if (typeof (c.q ?? '') !== 'string' || typeof (c.explain ?? '') !== 'string' || !c.choices.every(x => typeof x === 'string')) return null; // 객체가 섞이면 글자로 바꾸다 예외가 나 첫 화면이 깨진다
  return { area, type: String(type), q: clean(c.q ?? ''), choices: c.choices.map(clean), answer: c.answer, explain: clean(c.explain ?? ''), _k: key };
}

const store = {
  code: SHARED,
  rows: ls.get('skct-rows', []),     // 서버에서 받은 기록: [영역, 유형, 문제 키, 맞았으면 1, 걸린 초, 푼 시각(초), 틀렸으면 문제 내용]
  lastId: ls.get('skct-last', 0),    // 여기까지 받아 왔다
  outbox: ls.get('skct-outbox', []), // 아직 서버에 못 보낸 기록
  seen: new Map(),                   // 문제 키 → 마지막으로 푼 시각
  status: '',
  save() { ls.set('skct-code', this.code); ls.set('skct-rows', this.rows); ls.set('skct-last', this.lastId); ls.set('skct-outbox', this.outbox); },
  all() { return [...this.rows, ...this.outbox.map(o => [o.area, o.type, o.qkey, o.ok ? 1 : 0, o.sec, o.t, o.q])]; },
  // 오답 모음: 마지막으로 풀었을 때 틀린 문제(최근 것부터). 다시 풀어 맞히면 빠진다
  wrong() {
    const last = new Map(), body = new Map();
    for (const r of this.all()) {
      const p = last.get(r[2]);
      if (!p || r[5] >= p[5]) last.set(r[2], r); // 올린 순서가 아니라 푼 시각으로: 오프라인 기기가 늦게 올린 옛 풀이가 최근 풀이를 덮지 않게
      if (r[6]) body.set(r[2], r[6]);
    }
    return [...last.values()].filter(r => !r[3]).sort((a, b) => b[5] - a[5]).map(r => revive(r[0], r[1], r[2], body.get(r[2]))).filter(Boolean);
  },
  index() { this.seen = new Map(); for (const r of this.all()) this.seen.set(r[2], Math.max(r[5], this.seen.get(r[2]) || 0)); },
  // 유형별 집계: { "영역|유형": {r 맞힌 수, n 푼 수, s 걸린 초 합, k 시간 잰 횟수} }
  stats() {
    const out = {};
    for (const [area, type, , ok, sec] of this.all()) {
      const v = out[area + '|' + type] ||= { r: 0, n: 0, s: 0, k: 0 };
      v.n++; v.r += ok;
      if (sec != null) { v.s += sec; v.k++; }
    }
    return out;
  },
  log(q, ok, sec, mode) {
    const t = Math.round(Date.now() / 1000);
    const body = ok ? null : { q: q.q, choices: q.choices, answer: q.answer, explain: q.explain }; // 틀린 문제만 내용을 남긴다(오답 모음)
    this.outbox.push({ area: q.area, type: typeOf(q), qkey: keyOf(q), ok: !!ok, sec: sec ?? null, mode, t, q: body });
    this.seen.set(keyOf(q), t);
    this.save();
  },
  headers() { return { apikey: API_KEY, 'x-skct-code': this.code, 'Content-Type': 'application/json' }; },
  // 보낼 것을 보내고 새 기록을 받아 온다. 겹쳐 불려도 차례로 실행된다
  sync() { return this._chain = (this._chain || Promise.resolve()).then(() => this._sync()).catch(() => { this.status = '서버에 연결하지 못했습니다. 기록은 이 기기에 두었다가 다시 보냅니다.'; }).then(() => this.onsync?.()); }, // onsync: 화면의 저장 상태 문구를 고친다
  async _sync() {
    // 다른 기기에서 '기록 지우기'를 했으면 마지막으로 받은 행이 서버에 없다(지우기 말고는 행이 사라지지 않는다). 그러면 처음부터 다시 받는다
    if (this.lastId) {
      const r = await fetch(`${API}?select=id&id=eq.${this.lastId}`, { headers: this.headers() });
      if (!r.ok) throw new Error('확인 실패 ' + r.status);
      if (!(await r.json()).length) { this.rows = []; this.lastId = 0; }
    }
    const unsent = this.outbox.filter(o => !o.sent).slice(0, 500);
    if (unsent.length) {
      // 모든 행의 키를 같게 맞춘다(예전 형식 기록이 섞이면 서버가 묶음 전체를 거절한다). 시각은 올린 때가 아니라 푼 때
      const body = unsent.map(o => ({ area: o.area, type: o.type, qkey: o.qkey, ok: !!o.ok, sec: o.sec ?? null, mode: o.mode, q: o.q ?? null, ts: new Date(o.t * 1000).toISOString() }));
      const r = await fetch(API, { method: 'POST', headers: { ...this.headers(), Prefer: 'return=minimal' }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('보내기 실패 ' + r.status);
      unsent.forEach(o => o.sent = 1); // 받아 올 때까지 outbox에 둔다. 그사이 집계에서 빠지지 않게
      this.save();
    }
    const got = [];
    let last = this.lastId;
    for (;;) {
      const r = await fetch(`${API}?select=id,area,type,qkey,ok,sec,ts,q&id=gt.${last}&order=id&limit=1000`, { headers: this.headers() });
      if (!r.ok) throw new Error('받기 실패 ' + r.status);
      const rows = await r.json();
      for (const x of rows) { got.push([x.area, x.type, x.qkey, x.ok ? 1 : 0, x.sec, Math.round(Date.parse(x.ts) / 1000), x.q]); last = x.id; }
      if (rows.length < 1000) break;
    }
    // 받은 행 넣기와 보낸 기록 빼기를 한 번에 한다(중간에 화면이 같은 기록을 두 번 세거나 빠뜨리지 않게)
    this.rows.push(...got);
    this.lastId = last;
    this.outbox = this.outbox.filter(o => !o.sent);
    this.save();
    this.index();
    this.status = '';
  },
  // 기록을 서버와 이 기기에서 모두 지운다
  async wipe() {
    await this._chain; // 받아 오는 중에 지우면 지운 기록이 응답과 함께 되살아난다
    const r = await fetch(`${API}?id=gt.0`, { method: 'DELETE', headers: this.headers() });
    if (!r.ok) throw new Error('지우기 실패 ' + r.status);
    this.rows = []; this.lastId = 0; this.outbox = [];
    this.save(); this.index();
  },
};
// 예전에는 기기마다 무작위 코드를 썼다. 그 코드로 받아 둔 기록은 버리고 공용 기록을 처음부터 받는다(서버의 예전 코드 기록은 0건이었다)
if (ls.get('skct-code', null) !== SHARED) { store.rows = []; store.lastId = 0; }
store.save();
store.index();

// 안 푼 문제를 먼저 고른다. taken은 이번 세트에서 이미 뽑은 문제 키
// 자동 출제: 여러 번 뽑아 안 푼 것이 나오면 쓰고, 전부 푼 것이면 가장 오래전에 푼 것을 쓴다
function pickNew(make, taken) {
  let best, bestT = Infinity;
  for (let i = 0; i < 40; i++) {
    const q = make(), k = keyOf(q), t = store.seen.get(k);
    if (taken?.has(k)) continue;
    if (t === undefined) return q;
    if (t < bestT) { best = q; bestT = t; }
  }
  return best || make();
}
// 고정 문제: 안 푼 것을 무작위로, 다 풀었으면 오래전에 푼 순서로 n개
function pickNewStatic(pool, n, taken) {
  return shuffle(pool).sort((a, b) => (store.seen.get(keyOf(a)) || 0) - (store.seen.get(keyOf(b)) || 0)).filter(q => !taken?.has(keyOf(q))).slice(0, n);
}
