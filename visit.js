// 접속 기록: 언제, 어느 페이지를, 어떤 기기로 열었는지 서버에 남긴다. IP는 서버가 붙인다. 보는 곳은 log.html(관리자 코드 필요)
(() => {
  if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return; // 내 컴퓨터에서 고치며 확인할 때는 남기지 않는다
  const ua = navigator.userAgent;
  let visitor; // 브라우저마다 한 번 만든 무작위 번호. 같은 사람이 다시 왔는지 구분한다
  try { visitor = localStorage.getItem('skct-visitor'); } catch {}
  if (!/^[0-9a-z]{8,32}$/.test(visitor || '')) {
    visitor = [...crypto.getRandomValues(new Uint8Array(12))].map(x => (x % 36).toString(36)).join('');
    try { localStorage.setItem('skct-visitor', visitor); } catch {}
  }
  // 아이패드 사파리는 맥으로 자신을 알리므로 터치 지원 여부로 가린다
  const dev = (/iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) || /Macintosh/.test(ua) && navigator.maxTouchPoints > 1 ? 'iPad'
    : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : '기타') + ` ${screen.width}x${screen.height}`;
  fetch('https://jgkgacuzpoxkjuxcrjxc.supabase.co/rest/v1/skct_visits', {
    method: 'POST',
    headers: { apikey: 'sb_publishable_dk1WP0IeCX01Vw9z89nmzQ_qPqG99PI', 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ visitor, page: (location.pathname.split('/').pop() || 'index.html').slice(0, 40), dev, ua: ua.slice(0, 400), ref: document.referrer.slice(0, 300) || null }),
    keepalive: true,
  }).catch(() => {}); // 기록이 안 돼도 사이트는 그대로 쓴다
})();
