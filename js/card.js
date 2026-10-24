/* 開拓者組合會員証產生器 — 在底圖的 Name 欄寫上名字，可選擇會員編號，下載成 PNG。
 * 全部在瀏覽器內用 <canvas> 繪製，輸入的文字不會上傳。
 * 底圖：img/card.png（含預設編號 00001234）、img/card_blank.png（編號已去除，用來畫自訂編號）。
 * 座標單位都是「底圖像素」（底圖 654×418），輸出時放大 SCALE 倍。
 */
(function () {
  'use strict';

  const LANG_KEY = 'azki-ledger-lang';
  const THEME_KEY = 'azki-ledger-theme';
  const IMG_DEFAULT = 'img/card.png';
  const IMG_BLANK = 'img/card_blank.png';
  const SCALE = 2;

  // 版面（底圖像素）
  const NAME_BOX = { x: 314, w: 296, cy: 316, maxSize: 30, minSize: 14 };   // Name 欄白色區域內，標籤「Name」下方
  const NAME_COLOR = '#6f4242';

  // 名字可選的字體（網頁字體都來自 Google Fonts；載入失敗時依序退回後面的字體）
  const FALLBACK = '"Hiragino Sans","Yu Gothic","Microsoft JhengHei",sans-serif';
  const FONTS = {
    sans:   { weight: 700, families: ['Noto Sans TC', 'Noto Sans JP'] },
    round:  { weight: 700, families: ['Chiron GoRound TC', 'M PLUS Rounded 1c', 'Noto Sans JP'] },
    serif:  { weight: 700, families: ['Noto Serif TC', 'Noto Serif JP'] },
    kai:    { weight: 700, families: ['LXGW WenKai TC', 'Klee One', 'Noto Sans TC'] },
    pop:    { weight: 400, families: ['Dela Gothic One', 'Noto Sans TC', 'Noto Sans JP'] },
    script: { weight: 400, families: ['Pacifico', 'Noto Sans TC', 'Noto Sans JP'] }
  };
  const fontStack = key => FONTS[key].families.map(f => `"${f}"`).join(',') + ',' + FALLBACK;

  const I18N = {
    'zh-Hant': {
      'doc.title': '開拓者組合會員証｜開拓者の愉悅部',
      'doc.desc': '輸入名字，產生專屬的開拓者組合會員証圖片。非官方粉絲製作。',
      brand: '開拓者の愉悅部',
      'nav.ledger': '繳稅紀錄簿', 'nav.voice': 'Voice 收集簿', 'nav.card': '會員証', 'nav.ranking': '排行榜', 'nav.log': '更新日記',
      title: '開拓者組合會員証',
      lead: '輸入名字，產生屬於你的開拓者組合會員証圖片。',
      'card.alt': '開拓者組合會員証預覽',
      'name.label': '名字', 'name.ph': '輸入你的名字（最多 24 字）',
      'pos.label': '名字位置', 'pos.left': '靠左', 'pos.right': '靠右', 'pos.center': '置中',
      'font.label': '名字字體',
      'font.sans': '黑體（中・日・英）', 'font.round': '圓體（中・日・英）', 'font.serif': '明體（中・日・英）',
      'font.kai': '楷體手寫（中・日・英）', 'font.pop': '粗圓流行（日・英，中文用黑體）', 'font.script': '英文手寫（英，中日文用黑體）',
      'num.label': '會員編號',
      'num.default': '預設（00001234）', 'num.custom': '自己輸入', 'num.random': '隨機產生', 'num.none': '不顯示編號',
      'num.custom.label': '編號（最多 8 位數字，不足補 0）',
      'num.reroll': '重新產生編號',
      'btn.download': '下載圖片（PNG）',
      note: '名字與編號只在你的瀏覽器裡處理，不會上傳。名字太長時會自動縮小字體。',
      loading: '圖片讀取中…', failed: '底圖讀取失敗，請重新整理再試。',
      'theme.toDark': '切換深色模式', 'theme.toLight': '切換淺色模式',
      updated: '最後更新',
      footer1: '本站為開拓者自製的非官方粉絲網站，與 COVER 株式会社無關。',
      footer2: '會員証圖案與相關著作權皆歸屬於原權利人，產生的圖片僅供個人使用。'
    },
    ja: {
      'doc.title': '開拓者組合会員証｜開拓者の愉悦部',
      'doc.desc': '名前を入力して、自分だけの開拓者組合会員証の画像を作れます。非公式ファンサイトです。',
      brand: '開拓者の愉悦部',
      'nav.ledger': '納税記録簿', 'nav.voice': 'ボイスコレクション', 'nav.card': '会員証', 'nav.ranking': 'ランキング', 'nav.log': '更新日記',
      title: '開拓者組合 会員証',
      lead: '名前を入力して、自分だけの開拓者組合会員証の画像を作りましょう。',
      'card.alt': '開拓者組合会員証のプレビュー',
      'name.label': '名前', 'name.ph': '名前を入力（24文字まで）',
      'pos.label': '名前の位置', 'pos.left': '左', 'pos.right': '右', 'pos.center': '中央',
      'font.label': '名前のフォント',
      'font.sans': 'ゴシック体（中・日・英）', 'font.round': '丸ゴシック（中・日・英）', 'font.serif': '明朝体（中・日・英）',
      'font.kai': '楷書・手書き風（中・日・英）', 'font.pop': 'ポップな太字（日・英。中国語はゴシック）', 'font.script': '英字の筆記体（英。日中はゴシック）',
      'num.label': '会員番号',
      'num.default': 'デフォルト（00001234）', 'num.custom': '自分で入力', 'num.random': 'ランダム', 'num.none': '番号を表示しない',
      'num.custom.label': '番号（数字8桁まで。足りない分は0で補います）',
      'num.reroll': '番号を作り直す',
      'btn.download': '画像をダウンロード（PNG）',
      note: '名前や番号はブラウザ内で処理され、アップロードされません。長い名前は自動で小さくなります。',
      loading: '画像を読み込み中…', failed: '画像の読み込みに失敗しました。再読み込みしてください。',
      'theme.toDark': 'ダークモードに切り替え', 'theme.toLight': 'ライトモードに切り替え',
      updated: '最終更新',
      footer1: '本サイトは開拓者による非公式のファンサイトで、カバー株式会社とは一切関係ありません。',
      footer2: '会員証のデザインおよび関連する著作権は、すべて原権利者に帰属します。生成した画像は個人利用に限ります。'
    }
  };

  function detectLang() {
    try { const v = localStorage.getItem(LANG_KEY); if (I18N[v]) return v; } catch (e) { /* ignore */ }
    return /^ja/i.test(navigator.language || '') ? 'ja' : 'zh-Hant';
  }
  let lang = detectLang();
  const t = key => ((I18N[lang] || I18N['zh-Hant'])[key] ?? key);
  const $ = s => document.querySelector(s);

  /* ---------------- 繪製 ---------------- */
  const images = {};
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
  }

  const state = { mode: 'default', name: '', num: '', rand: '', font: 'sans', pos: 0 };   // pos：0 = 靠左、100 = 靠右
  let drawToken = 0;

  const pad8 = s => String(s).replace(/\D/g, '').slice(0, 8).padStart(8, '0');
  const randomNum = () => String(Math.floor(Math.random() * 1e8)).padStart(8, '0');

  async function ensureFonts(text) {
    if (!document.fonts || !document.fonts.load) return;
    try {
      const f = FONTS[state.font];
      await Promise.all([
        ...f.families.map(fam => document.fonts.load(`${f.weight} 24px "${fam}"`, text || 'A').catch(() => {}))
      ]);
    } catch (e) { /* 字體載入失敗就用系統字體 */ }
  }

  function drawName(ctx, name) {
    if (!name) return;
    const family = fontStack(state.font), weight = FONTS[state.font].weight;
    let size = NAME_BOX.maxSize;
    ctx.font = `${weight} ${size}px ${family}`;
    let w = ctx.measureText(name).width;
    if (w > NAME_BOX.w) {
      size = Math.max(NAME_BOX.minSize, Math.floor(size * NAME_BOX.w / w * 10) / 10);
      ctx.font = `${weight} ${size}px ${family}`;
    }
    ctx.fillStyle = NAME_COLOR;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    // 太長仍放不下時，從頭開始裁切並加上省略號
    let text = name;
    while (ctx.measureText(text).width > NAME_BOX.w && text.length > 1) text = text.slice(0, -1);
    if (text !== name) text = text.slice(0, -1) + '…';
    // 依滑桿位置在欄位內左右移動（永遠不會超出白色欄位）
    const free = Math.max(0, NAME_BOX.w - ctx.measureText(text).width);
    ctx.fillText(text, NAME_BOX.x + free * state.pos / 100, NAME_BOX.cy);
  }

  /* 編號：仿照原圖的細長方角數字，用線條路徑畫出 0–9（座標取自原圖 00001234 的實際像素）。
   * 每個數字的外框約 19×34（底圖像素），筆畫寬約 3.8。 */
  const S = 3.8;                                   // 筆畫寬
  const L = 1.9, R = 17.3, T = 1.9, B = 31.6, M = 16.8, R2 = 16.6;
  const GLYPHS = {
    0: [{ rect: [L, T, R, B] }],
    1: [[[5.6, 7.4], [9.6, 2.2]], [[7.4, 7], [9.6, 4.2]], [[9.6, 0.4], [9.6, 31.6]], [[0.4, 31.4], [19, 31.4]]],
    2: [[[0.6, T], [R2, T], [R2, M], [L, M], [L, B], [18.6, B]]],
    3: [[[0.8, T], [R, T], [R, B], [L, B], [L, 28.8]], [[4.6, M - 0.4], [R, M - 0.4]]],
    4: [[[L, -0.6], [L, M], [19, M]], [[13, -0.6], [13, 33.2]]],
    5: [[[18.6, T], [L, T], [L, M], [R, M], [R, B], [L, B], [L, 28.8]]],
    6: [[[18.6, T], [L, T], [L, B], [R, B], [R, M], [L, M]]],
    7: [[[L, 6.2], [L, T], [R, T], [R, 33.2]]],
    8: [{ rect: [L, T, R, B] }, [[L, M], [R, M]]],
    9: [[[R, M], [L, M], [L, T], [R, T], [R, B], [L, B], [L, 28.8]]]
  };
  const NUM_X0 = 370, NUM_PITCH = 27.71, NUM_Y0 = 358;  // 第一個數字左上角、字距（底圖像素）

  function tracePoly(ctx, pts, r) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length - 1; k++) ctx.arcTo(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], r);
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }
  function traceRect(ctx, [x1, y1, x2, y2], r) {
    const mx = (x1 + x2) / 2;
    ctx.moveTo(mx, y1);
    ctx.arcTo(x2, y1, x2, y2, r);
    ctx.arcTo(x2, y2, x1, y2, r);
    ctx.arcTo(x1, y2, x1, y1, r);
    ctx.arcTo(x1, y1, x2, y1, r);
    ctx.closePath();
  }
  function traceGlyph(ctx, d) {
    ctx.beginPath();
    for (const part of GLYPHS[d]) {
      if (part.rect) traceRect(ctx, part.rect, 3.6);
      else tracePoly(ctx, part, 3);
    }
  }

  // 先在「底圖原尺寸」的畫布上畫，再和底圖一起放大，讓銳利度與原圖的數字一致
  function drawNumber(mainCtx, digits, w, h) {
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    for (let i = 0; i < digits.length; i++) {
      const d = digits[i];
      if (!GLYPHS[d]) continue;
      ctx.save();
      ctx.translate(NUM_X0 + NUM_PITCH * i, NUM_Y0);
      // 1) 外圈：深金色描邊＋淡紫色柔和陰影（原圖數字周圍有一圈紫色暈影）
      traceGlyph(ctx, d);
      ctx.shadowColor = 'rgba(105, 60, 140, .55)';
      ctx.shadowBlur = 3;
      ctx.lineWidth = S + 0.9;
      ctx.strokeStyle = '#b07d22';
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      // 2) 主體：金色漸層
      const g = ctx.createLinearGradient(0, 0, 0, 34);
      g.addColorStop(0, '#f8dc8e');
      g.addColorStop(0.35, '#eec062');
      g.addColorStop(0.6, '#dca63a');
      g.addColorStop(1, '#f3cf76');
      traceGlyph(ctx, d);
      ctx.lineWidth = S - 0.4;
      ctx.strokeStyle = g;
      ctx.stroke();
      // 3) 中央亮線，做出金屬光澤
      traceGlyph(ctx, d);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(255, 244, 200, .55)';
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    mainCtx.drawImage(off, 0, 0, w, h);
  }

  function currentDigits() {
    if (state.mode === 'custom') return pad8(state.num);
    if (state.mode === 'random') return state.rand;
    return null;
  }

  async function draw() {
    const token = ++drawToken;
    const canvas = $('#card-canvas');
    const useDefault = state.mode === 'default';
    const base = images[useDefault ? 'full' : 'blank'];
    if (!base) return;
    await ensureFonts(state.name);
    if (token !== drawToken) return;     // 輸入太快時只畫最後一次

    const w = base.naturalWidth, h = base.naturalHeight;
    canvas.width = w * SCALE;
    canvas.height = h * SCALE;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(base, 0, 0, w, h);
    drawName(ctx, state.name.trim());
    const digits = currentDigits();
    if (digits) drawNumber(ctx, digits, w, h);
    $('#btn-download').disabled = false;
  }

  /* ---------------- UI ---------------- */
  function syncMode() {
    $('#row-custom').hidden = state.mode !== 'custom';
    $('#row-random').hidden = state.mode !== 'random';
    if (state.mode === 'random' && !state.rand) state.rand = randomNum();
    $('#rand-val').textContent = state.rand;
  }

  function download() {
    const canvas = $('#card-canvas');
    canvas.toBlob(blob => {
      if (!blob) return;
      const safe = state.name.trim().replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 24);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pioneers-card' + (safe ? '_' + safe : '') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, 'image/png');
  }

  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t('doc.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('doc.desc'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    updateThemeButton();
  }
  function setLang(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    applyStaticI18n();
  }
  function isDark() {
    const a = document.documentElement.getAttribute('data-theme');
    if (a) return a === 'dark';
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function updateThemeButton() {
    const b = $('#btn-theme');
    if (!b) return;
    const dark = isDark();
    b.textContent = dark ? '☀️' : '🌙';
    b.setAttribute('aria-label', dark ? t('theme.toLight') : t('theme.toDark'));
    b.title = b.getAttribute('aria-label');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#09090a' : '#f4348b');
  }
  function toggleTheme() {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    updateThemeButton();
  }

  async function init() {
    applyStaticI18n();
    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.addEventListener('click', () => setLang(b.dataset.lang)));
    $('#btn-theme').addEventListener('click', toggleTheme);

    $('#in-name').addEventListener('input', e => { state.name = e.target.value; draw(); });
    $('#in-pos').addEventListener('input', e => { state.pos = +e.target.value; draw(); });
    $('#btn-center').addEventListener('click', () => { state.pos = 50; $('#in-pos').value = 50; draw(); });
    $('#in-font').addEventListener('change', e => { state.font = e.target.value; draw(); });
    $('#in-mode').addEventListener('change', e => { state.mode = e.target.value; syncMode(); draw(); });
    $('#in-num').addEventListener('input', e => {
      const v = e.target.value.replace(/\D/g, '').slice(0, 8);
      if (v !== e.target.value) e.target.value = v;
      state.num = v;
      draw();
    });
    $('#btn-random').addEventListener('click', () => { state.rand = randomNum(); syncMode(); draw(); });
    $('#btn-download').addEventListener('click', download);
    syncMode();

    try {
      const [full, blank] = await Promise.all([loadImage(IMG_DEFAULT), loadImage(IMG_BLANK)]);
      images.full = full; images.blank = blank;
      $('#card-state').hidden = true;
      draw();
    } catch (e) {
      $('#card-state').textContent = t('failed');
    }
  }

  if (typeof document !== 'undefined') init();
})();
