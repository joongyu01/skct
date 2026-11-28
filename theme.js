// 어두운 화면: 브라우저 설정과 상관없이 오른쪽 아래 버튼으로 켜고 끄고, 고른 값을 이 기기에 기억한다(모든 페이지 공통).
// <head>에서 바로 읽어 첫 화면부터 맞는 색으로 그린다. 색은 각 페이지의 :root[data-theme=dark] 규칙에 있다
(() => {
  const KEY = 'skct-theme', root = document.documentElement;
  let dark = false;
  try { dark = localStorage.getItem(KEY) === 'dark'; } catch {}
  const apply = () => dark ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme');
  apply();
  const css = document.createElement('style');
  css.textContent = '#theme-toggle { position: fixed; right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom)); z-index: 10; width: 44px; height: 44px; margin: 0; padding: 0; border: 1px solid #999; border-radius: 50%; background: #fff; font-size: 22px; line-height: 1; cursor: pointer; touch-action: manipulation; box-shadow: 0 1px 4px rgba(0,0,0,.25); }'
    + ':root[data-theme=dark] #theme-toggle { background: #2a2d33; border-color: #5a5f67; }'
    // 맨 아래 내용을 버튼 위로 올려 볼 수 있게 스크롤할 자리를 둔다
    + 'html body { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)); }';
  document.head.append(css);
  const label = b => {
    b.textContent = dark ? '☀️' : '🌙';
    b.title = dark ? '밝은 화면으로' : '어두운 화면으로';
    b.setAttribute('aria-label', b.title);
  };
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'theme-toggle';
    label(b);
    b.onclick = () => {
      dark = !dark;
      apply();
      label(b);
      try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch {}
    };
    document.body.append(b);
  });
  // 뒤로 가기로 캐시에서 되살아난 페이지는 스크립트가 다시 돌지 않으므로, 다른 페이지에서 바꾼 설정을 다시 읽는다
  addEventListener('pageshow', e => {
    if (!e.persisted) return;
    try { dark = localStorage.getItem(KEY) === 'dark'; } catch {}
    apply();
    const b = document.getElementById('theme-toggle');
    if (b) label(b);
  });
})();
