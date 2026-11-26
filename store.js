// 풀이 기록 저장소. 기록을 서버(Supabase)에 저장하고, 푼 문제를 기억해 같은 문제가 다시 나오지 않게 한다.
// 접근 제어: 로그인 대신 무작위 "동기화 코드"를 x-skct-code 헤더로 보낸다. 서버는 RLS로 그 코드의 기록만 읽고 쓰게 한다.
// 서버가 안 되면 기록을 이 기기(outbox)에 두었다가 다음에 보낸다.
const API = 'https://jgkgacuzpoxkjuxcrjxc.supabase.co/rest/v1/skct_attempts';
const API_KEY = 'sb_publishable_dk1WP0IeCX01Vw9z89nmzQ_qPqG99PI'; // 브라우저에 두라고 만든 공개용 키
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
const newCode = () => [...crypto.getRandomValues(new Uint8Array(24))].map(x => (x % 36).toString(36)).join('');

const store = {
  code: ls.get('skct-code', null) || newCode(),
  rows: ls.get('skct-rows', []),     // 서버에서 받은 기록: [영역, 유형, 문제 키, 맞았으면 1, 걸린 초, 푼 시각(초)]
  lastId: ls.get('skct-last', 0),    // 여기까지 받아 왔다
  outbox: ls.get('skct-outbox', []), // 아직 서버에 못 보낸 기록
  seen: new Map(),                   // 문제 키 → 마지막으로 푼 시각
  status: '',
  save() { ls.set('skct-code', this.code); ls.set('skct-rows', this.rows); ls.set('skct-last', this.lastId); ls.set('skct-outbox', this.outbox); },
  all() { return [...this.rows, ...this.outbox.map(o => [o.area, o.type, o.qkey, o.ok ? 1 : 0, o.sec, o.t])]; },
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
    this.outbox.push({ area: q.area, type: typeOf(q), qkey: keyOf(q), ok: !!ok, sec: sec ?? null, mode, t });
    this.seen.set(keyOf(q), t);
    this.save();
  },
  headers() { return { apikey: API_KEY, 'x-skct-code': this.code, 'Content-Type': 'application/json' }; },
  // 보낼 것을 보내고 새 기록을 받아 온다. 겹쳐 불려도 차례로 실행된다
  sync() { return this._chain = (this._chain || Promise.resolve()).then(() => this._sync()).catch(() => { this.status = '서버에 연결하지 못했습니다. 기록은 이 기기에 두었다가 다시 보냅니다.'; }).then(() => this.onsync?.()); }, // onsync: 화면의 저장 상태 문구를 고친다
  async _sync() {
    if (this.outbox.length) {
      const batch = this.outbox.slice(0, 500);
      const r = await fetch(API, { method: 'POST', headers: { ...this.headers(), Prefer: 'return=minimal' }, body: JSON.stringify(batch.map(({ t, ...row }) => row)) });
      if (!r.ok) throw new Error('보내기 실패 ' + r.status);
      this.outbox = this.outbox.slice(batch.length);
      this.save();
    }
    for (;;) {
      const r = await fetch(`${API}?select=id,area,type,qkey,ok,sec,ts&id=gt.${this.lastId}&order=id&limit=1000`, { headers: this.headers() });
      if (!r.ok) throw new Error('받기 실패 ' + r.status);
      const rows = await r.json();
      for (const x of rows) { this.rows.push([x.area, x.type, x.qkey, x.ok ? 1 : 0, x.sec, Math.round(Date.parse(x.ts) / 1000)]); this.lastId = x.id; }
      if (rows.length < 1000) break;
    }
    this.save();
    this.index();
    this.status = '';
  },
  // 다른 기기의 코드로 바꾼다. 이 기기에 받아 둔 기록은 버리고 새 코드의 기록을 받는다
  async useCode(code) {
    await this.sync(); // 남은 기록을 지금 코드로 먼저 보낸다
    this.code = code; this.rows = []; this.lastId = 0; this.outbox = [];
    this.save(); this.index();
    await this.sync();
  },
  // 이 코드의 기록을 서버와 이 기기에서 모두 지운다
  async wipe() {
    const r = await fetch(`${API}?id=gt.0`, { method: 'DELETE', headers: this.headers() });
    if (!r.ok) throw new Error('지우기 실패 ' + r.status);
    this.rows = []; this.lastId = 0; this.outbox = [];
    this.save(); this.index();
  },
};
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
