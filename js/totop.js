/* 回到最上面按鈕：捲動一段距離後出現在右下角（各頁共用） */
(function () {
  'use strict';
  const LABEL = { 'zh-Hant': '回到最上面', ja: 'ページの先頭へ' };
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'to-top';
  btn.textContent = '↑';
  btn.hidden = true;
  const label = () => LABEL[document.documentElement.lang] || LABEL['zh-Hant'];
  function sync() {
    const show = window.scrollY > 600;
    if (btn.hidden === show) btn.hidden = !show;
    btn.setAttribute('aria-label', label());
    btn.title = label();
  }
  btn.addEventListener('click', () => {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  document.body.appendChild(btn);
  window.addEventListener('scroll', sync, { passive: true });
  sync();
})();
