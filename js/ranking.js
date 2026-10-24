/* 排行榜：熱門周邊、熱門 Voice（依本站購買／收集人數）、Voice 完成率（自願參加）
 * 周邊與 Voice 的清單直接讀兩份 CSV（和繳稅紀錄簿、Voice 收集簿相同的規則產生紀錄鍵），
 * 人數與完成率由 Supabase 的統計函式提供（只回傳彙總結果）。
 */
(function () {
  'use strict';

  const SHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzbU98iI2i-dAfZK00DziH76BV-blVra_k7dh1ffVoGIiE-beegRPM8fwT0aV1iqD3gfc3DgLkZMHb/pub?single=true&output=csv&gid=';
  const GOODS_CSV = SHEET + '208155527';
  const VOICE_CSV = SHEET + '1253772289';
  const LANG_KEY = 'azki-ledger-lang';
  const THEME_KEY = 'azki-ledger-theme';
  const GOODS_ORDER = ['acrylic stand', 'badge', 'plushie', 'keychain'];

  const I18N = {
    'zh-Hant': {
      'doc.title': '排行榜｜開拓者の愉悅部',
      brand: '開拓者の愉悅部',
      'nav.ledger': '繳稅紀錄簿', 'nav.voice': 'Voice 收集簿', 'nav.ranking': '排行榜', 'nav.log': '更新日記',
      title: '排行榜',
      lead: '本站開拓者的熱門周邊、熱門 Voice，以及自願參加的 Voice 完成率排行榜。',
      'tab.goods': '熱門周邊', 'tab.voice': '熱門 Voice', 'tab.completion': 'Voice 完成率',
      'f.year': '年份', 'f.type': '種類', 'f.top': '顯示', all: '全部',
      'gtype.acrylic stand': '壓克力立牌', 'gtype.badge': '徽章', 'gtype.plushie': '娃娃', 'gtype.keychain': '吊飾',
      loading: '讀取中…', failed: '讀取失敗，請稍後再試。', retry: '重新讀取',
      'note.hot': '依「本站開拓者中」已登入並同步紀錄的人數統計，不是實際銷量。',
      'note.comp': n => `完成率＝已收集的 Voice 數 ÷ 收錄的 ${n} 個 Voice。只列出在個人設定中選擇參加的人；完成率相同時，先達成的排前面。`,
      'note.comp.join': '想參加嗎？登入後在右上角頭像選單的「個人設定」開啟。',
      'note.comp.joinme': '你還沒有參加。到右上角頭像選單的「個人設定」設定暱稱並開啟參加。',
      empty: '目前還沒有資料。', 'empty.comp': '目前還沒有人參加。',
      people: n => `${n} 人`, hidden: '（暱稱已隱藏）', me: '你',
      'goto.goods': '到繳稅紀錄簿查看', 'goto.voice': '到 Voice 收集簿查看',
      report: '檢舉', 'rp.title': '檢舉',
      'rp.desc': name => `要檢舉「${name}」的哪一項？檢舉會交由管理員確認，被多人檢舉時會先自動隱藏。`,
      'rp.avatar': '不當頭像', 'rp.nickname': '不當暱稱', 'rp.cancel': '取消',
      'rp.done': '已送出檢舉，謝謝你。', 'rp.dup': '你已經檢舉過這一項了。', 'rp.failed': '檢舉送出失敗，請稍後再試。',
      'theme.toDark': '切換深色模式', 'theme.toLight': '切換淺色模式',
      footer1: '本站為開拓者自製的非官方粉絲網站，與 COVER 株式会社無關。'
    },
    ja: {
      'doc.title': 'ランキング｜開拓者の愉悦部',
      brand: '開拓者の愉悦部',
      'nav.ledger': '納税記録簿', 'nav.voice': 'ボイスコレクション', 'nav.ranking': 'ランキング', 'nav.log': '更新日記',
      title: 'ランキング',
      lead: '本サイトの開拓者による人気グッズ・人気ボイスと、参加者によるボイスのコンプリート率ランキングです。',
      'tab.goods': '人気グッズ', 'tab.voice': '人気ボイス', 'tab.completion': 'ボイスのコンプリート率',
      'f.year': '年', 'f.type': '種類', 'f.top': '表示', all: 'すべて',
      'gtype.acrylic stand': 'アクリルスタンド', 'gtype.badge': '缶バッジ', 'gtype.plushie': 'ぬいぐるみ', 'gtype.keychain': 'キーホルダー',
      loading: '読み込み中…', failed: '読み込みに失敗しました。しばらくしてからお試しください。', retry: '再読み込み',
      'note.hot': '本サイトでログインして記録を同期している開拓者の人数です。実際の販売数ではありません。',
      'note.comp': n => `コンプリート率＝収集したボイス数 ÷ 掲載中の ${n} 件。個人設定で参加を選んだ人のみ表示します。同率の場合は先に達成した人が上位です。`,
      'note.comp.join': '参加するには、ログイン後に右上のアイコンメニュー「個人設定」でオンにしてください。',
      'note.comp.joinme': 'まだ参加していません。右上のアイコンメニュー「個人設定」でニックネームを設定し、参加をオンにしてください。',
      empty: 'まだデータがありません。', 'empty.comp': 'まだ参加者がいません。',
      people: n => `${n} 人`, hidden: '（ニックネーム非表示）', me: 'あなた',
      'goto.goods': '納税記録簿で見る', 'goto.voice': 'ボイスコレクションで見る',
      report: '通報', 'rp.title': '通報',
      'rp.desc': name => `「${name}」のどの項目を通報しますか？管理者が確認します。複数の通報があると自動で非表示になります。`,
      'rp.avatar': '不適切なアイコン', 'rp.nickname': '不適切なニックネーム', 'rp.cancel': 'キャンセル',
      'rp.done': '通報を送信しました。ありがとうございます。', 'rp.dup': 'この項目はすでに通報済みです。', 'rp.failed': '通報の送信に失敗しました。しばらくしてからお試しください。',
      'theme.toDark': 'ダークモードに切り替え', 'theme.toLight': 'ライトモードに切り替え',
      footer1: '本サイトは開拓者による非公式のファンサイトで、カバー株式会社とは一切関係ありません。'
    }
  };
  function detectLang() {
    try { const v = localStorage.getItem(LANG_KEY); if (I18N[v]) return v; } catch (e) { /* ignore */ }
    return /^ja/i.test(navigator.language || '') ? 'ja' : 'zh-Hant';
  }
  let lang = detectLang();
  const t = (key, ...args) => {
    const v = (I18N[lang] || I18N['zh-Hant'])[key];
    return typeof v === 'function' ? v(...args) : (v == null ? key : v);
  };
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const gLabel = ty => I18N[lang]['gtype.' + ty] || ty;

  /* ---------------- CSV（規則與 app.js／voice.js 相同） ---------------- */
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const rows = [];
    let row = [], field = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const header = rows[0].map(h => h.trim().toLowerCase());
    return rows.slice(1).filter(r => r.some(v => v.trim() !== ''))
      .map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])));
  }
  function parseDate(s) {
    const m = /(\d{4})\D?(\d{1,2})\D?(\d{1,2})/.exec(s || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  }
  const normName = s => String(s || '').replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')');

  function goodsItems(rows) {
    const projects = new Map();
    rows.forEach(r => {
      const code = r['goods project code'];
      if (!code) return;
      let p = projects.get(code);
      if (!p) { p = { code, name: '', dateText: '', cover: '', items: [] }; projects.set(code, p); }
      const goodsName = r['goods name'];
      const isCover = r['goods index'] === '0' || !goodsName;
      if (r['goods project name'] && (isCover || !p.name)) p.name = r['goods project name'];
      if (r['date'] && (isCover || !p.dateText)) p.dateText = r['date'];
      if (isCover) {
        if (r['goods picture'] && (!p.cover || r['goods index'] === '0')) p.cover = r['goods picture'];
        return;
      }
      const idx = parseInt(r['goods index'], 10);
      p.items.push({ key: code + '#' + (Number.isFinite(idx) ? idx : goodsName), name: goodsName,
        type: (r['goods type'] || '').toLowerCase(), img: r['goods picture'] });
    });
    const out = [];
    projects.forEach(p => {
      const d = parseDate(p.dateText);
      p.items.forEach(it => out.push(Object.assign(it, {
        project: p.name, code: p.code, date: d, year: d ? d.getFullYear() : null, img: it.img || p.cover })));
    });
    return out;
  }
  function voiceItems(rows) {
    const projects = new Map();
    rows.forEach(r => {
      const code = r['project code'], voice = r['voice name'];
      if (!code || !voice) return;
      let p = projects.get(code);
      if (!p) { p = { code, name: '', dateText: '', cover: '', items: [] }; projects.set(code, p); }
      if (!p.name) p.name = r['project name'];
      if (!p.dateText) p.dateText = r['date'];
      if (!p.cover) p.cover = r['picture link'];
      const key = code + '#' + normName(voice);
      if (p.items.some(it => it.key === key)) return;
      p.items.push({ key, name: voice });
    });
    const out = [];
    projects.forEach(p => {
      const d = parseDate(p.dateText);
      p.items.forEach(it => out.push(Object.assign(it, {
        project: p.name, code: p.code, date: d, year: d ? d.getFullYear() : null, img: p.cover })));
    });
    return out;
  }

  /* ---------------- state ---------------- */
  const state = {
    tab: 'goods', year: 'all', type: 'all', top: 20,
    goods: null, voice: null, counts: { goods: null, voice: null }, comp: null, compKey: ''
  };

  async function fetchCSV(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    return parseCSV(await res.text());
  }

  const currentItems = () => (state.tab === 'goods' ? state.goods : state.voice);
  const yearsOf = items => [...new Set((items || []).map(i => i.year).filter(Boolean))].sort((a, b) => b - a);
  function filtered(items) {
    return (items || []).filter(i =>
      (state.year === 'all' || String(i.year) === state.year) &&
      (state.tab !== 'goods' || state.type === 'all' || i.type === state.type));
  }

  function buildFilters() {
    const ys = yearsOf(currentItems());
    if (state.year !== 'all' && !ys.includes(+state.year)) state.year = 'all';
    $('#rk-year').innerHTML = `<option value="all">${esc(t('all'))}</option>` +
      ys.map(y => `<option value="${y}"${String(y) === state.year ? ' selected' : ''}>${y}</option>`).join('');
    $('#rk-type-wrap').hidden = state.tab !== 'goods';
    if (state.tab === 'goods') {
      const types = [...new Set((state.goods || []).map(i => i.type).filter(Boolean))]
        .sort((a, b) => ((GOODS_ORDER.indexOf(a) + 1) || 99) - ((GOODS_ORDER.indexOf(b) + 1) || 99) || a.localeCompare(b));
      if (state.type !== 'all' && !types.includes(state.type)) state.type = 'all';
      $('#rk-type').innerHTML = `<option value="all">${esc(t('all'))}</option>` +
        types.map(ty => `<option value="${esc(ty)}"${ty === state.type ? ' selected' : ''}>${esc(gLabel(ty))}</option>`).join('');
    }
    document.querySelectorAll('.rk-tabs button').forEach(b => {
      const on = b.dataset.tab === state.tab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    });
  }

  const thumb = (src, alt) => src
    ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer">`
    : '<span class="rk-noimg"></span>';

  function renderHot() {
    const book = state.tab === 'goods' ? 'goods' : 'voice';
    const counts = state.counts[book];
    const list = $('#rk-list');
    $('#rk-note').textContent = t('note.hot');
    if (!counts) { list.innerHTML = `<li class="state">${esc(t('loading'))}</li>`; return; }
    const rows = filtered(currentItems())
      .map(i => ({ i, n: counts.items[i.key] || 0 }))
      .filter(x => x.n > 0)
      .sort((a, b) => b.n - a.n || ((b.i.date ? b.i.date.getTime() : 0) - (a.i.date ? a.i.date.getTime() : 0)))
      .slice(0, state.top);
    if (!rows.length) { list.innerHTML = `<li class="state">${esc(t('empty'))}</li>`; return; }
    const page = book === 'goods' ? './' : 'voice.html';
    let rank = 0, prev = null;
    list.innerHTML = rows.map((x, idx) => {
      if (x.n !== prev) { rank = idx + 1; prev = x.n; }     // 同人數同名次
      const href = `${page}#item=${encodeURIComponent(x.i.key)}`;
      const sub = [x.i.year, x.i.project, book === 'goods' && x.i.type ? gLabel(x.i.type) : ''].filter(Boolean).join('・');
      return `<li class="rk-row${rank <= 3 ? ' top' + rank : ''}">
        <span class="rk-rank">${rank}</span>
        <a class="rk-thumb" href="${esc(href)}" title="${esc(t(book === 'goods' ? 'goto.goods' : 'goto.voice'))}">${thumb(x.i.img, x.i.name)}</a>
        <div class="rk-main">
          <a class="rk-name" href="${esc(href)}">${esc(x.i.name)}</a>
          <span class="rk-sub">${esc(sub)}</span>
        </div>
        <span class="rk-val">👥 ${esc(t('people', x.n))}</span>
      </li>`;
    }).join('');
  }

  async function loadCompletion() {
    const keys = filtered(state.voice).map(i => i.key);
    const ck = state.year + '|' + keys.length + '|' + state.top;
    if (state.compKey === ck && state.comp) { renderCompletion(); return; }
    state.compKey = ck;
    state.comp = null;
    renderCompletion();
    const client = window.AzkiCloud && window.AzkiCloud.client();
    if (!client) { state.comp = { error: true }; renderCompletion(); return; }
    const { data, error } = await client.rpc('get_voice_completion', { p_keys: keys, p_limit: state.top });
    if (state.compKey !== ck) return;
    if (error) console.warn('[ranking] completion failed', error);
    state.comp = error ? { error: true } : { rows: data || [], total: keys.length };
    renderCompletion();
  }

  function renderCompletion() {
    const list = $('#rk-list');
    const total = filtered(state.voice).length;
    const me = window.AzkiCloud && window.AzkiCloud.currentUser();
    const comp = state.comp;
    let note = t('note.comp', total);
    if (comp && comp.rows) {
      if (!me) note += ' ' + t('note.comp.join');
      else if (!comp.rows.some(r => r.user_id === me.id)) note += ' ' + t('note.comp.joinme');
    }
    $('#rk-note').textContent = note;
    if (!comp) { list.innerHTML = `<li class="state">${esc(t('loading'))}</li>`; return; }
    if (comp.error) {
      list.innerHTML = `<li class="state"><p>${esc(t('failed'))}</p><button type="button" class="btn" data-retry>${esc(t('retry'))}</button></li>`;
      return;
    }
    if (!comp.rows.length) { list.innerHTML = `<li class="state">${esc(t('empty.comp'))}</li>`; return; }
    list.innerHTML = comp.rows.map((r, idx) => {
      const rank = idx + 1;
      const n = Number(r.collected);
      const pct = comp.total ? Math.floor(n / comp.total * 1000) / 10 : 0;
      const name = r.nickname || t('hidden');
      const av = window.AzkiCloud.avatarUrl(r.avatar_path);
      const mine = !!(me && r.user_id === me.id);
      return `<li class="rk-row rk-user${rank <= 3 ? ' top' + rank : ''}${mine ? ' mine' : ''}">
        <span class="rk-rank">${rank}</span>
        <span class="rk-avatar">${av ? `<img src="${esc(av)}" alt="" loading="lazy">` : esc((r.nickname || '?').slice(0, 1).toUpperCase())}</span>
        <div class="rk-main">
          <span class="rk-name${r.nickname ? '' : ' muted'}">${esc(name)}${mine ? ` <span class="tag">${esc(t('me'))}</span>` : ''}</span>
          <span class="rk-bar"><span style="width:${Math.min(100, pct)}%"></span></span>
        </div>
        <span class="rk-val"><b>${pct}%</b><small>${n} / ${comp.total}</small></span>
        ${me && !mine ? `<button type="button" class="rk-report" data-report="${esc(r.user_id)}" data-name="${esc(name)}">${esc(t('report'))}</button>` : ''}
      </li>`;
    }).join('');
  }

  function render() {
    buildFilters();
    if (state.tab === 'completion') loadCompletion(); else renderHot();
  }

  /* ---------------- 檢舉 ---------------- */
  function report(target, name) {
    const dlg = document.createElement('dialog');
    dlg.className = 'dlg';
    dlg.innerHTML = `<form method="dialog"><button class="lb-close" value="cancel" aria-label="×">×</button></form>
      <h2>${esc(t('rp.title'))}</h2><p>${esc(t('rp.desc', name))}</p>
      <form method="dialog" class="del-actions">
        <button type="submit" value="cancel" class="btn ghost">${esc(t('rp.cancel'))}</button>
        <button type="submit" value="avatar" class="btn">${esc(t('rp.avatar'))}</button>
        <button type="submit" value="nickname" class="btn">${esc(t('rp.nickname'))}</button>
      </form>`;
    dlg.addEventListener('close', async () => {
      const kind = dlg.returnValue;
      dlg.remove();
      if (kind !== 'avatar' && kind !== 'nickname') return;
      const { error } = await window.AzkiCloud.client().from('reports').insert({ target, kind });
      if (!error) alert(t('rp.done'));
      else if (error.code === '23505') alert(t('rp.dup'));
      else { console.warn('[ranking] report failed', error); alert(t('rp.failed')); }
    });
    document.body.appendChild(dlg);
    dlg.showModal();
  }

  /* ---------------- i18n / theme ---------------- */
  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t('doc.title');
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('.lang-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    updateThemeButton();
  }
  function setLang(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    applyStaticI18n();
    if (state.goods) render();
    if (window.AzkiCloud) window.AzkiCloud.refreshLang();
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
  }

  /* ---------------- init ---------------- */
  async function load() {
    $('#rk-list').innerHTML = `<li class="state">${esc(t('loading'))}</li>`;
    try {
      const [g, v] = await Promise.all([fetchCSV(GOODS_CSV), fetchCSV(VOICE_CSV)]);
      state.goods = goodsItems(g);
      state.voice = voiceItems(v);
      render();
    } catch (e) {
      $('#rk-list').innerHTML = `<li class="state"><p>${esc(t('failed'))}</p><button type="button" class="btn" data-reload>${esc(t('retry'))}</button></li>`;
    }
  }

  const TABS = ['goods', 'voice', 'completion'];
  function setTab(tab) {
    state.tab = TABS.includes(tab) ? tab : 'goods';
    if (location.hash !== '#' + state.tab) history.replaceState(null, '', '#' + state.tab);
    if (state.goods) render();
  }

  if (typeof document !== 'undefined') {
    applyStaticI18n();
    const h = (location.hash || '').replace('#', '');
    state.tab = TABS.includes(h) ? h : 'goods';
    document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
    $('#btn-theme').addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      updateThemeButton();
    });
    document.querySelectorAll('.rk-tabs button').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
    $('#rk-year').addEventListener('change', e => { state.year = e.target.value; render(); });
    $('#rk-type').addEventListener('change', e => { state.type = e.target.value; render(); });
    $('#rk-top').addEventListener('change', e => { state.top = +e.target.value; render(); });
    $('#rk-list').addEventListener('click', e => {
      const rp = e.target.closest('[data-report]');
      if (rp) { report(rp.dataset.report, rp.dataset.name); return; }
      if (e.target.closest('[data-retry]')) { state.compKey = ''; loadCompletion(); return; }
      if (e.target.closest('[data-reload]')) load();
    });
    if (window.AzkiCloud) {
      window.AzkiCloud.init({ books: {} });
      const empty = { items: {}, projects: {} };
      window.AzkiCloud.getCounts('ledger').then(c => { state.counts.goods = c || empty; if (state.goods && state.tab === 'goods') renderHot(); });
      window.AzkiCloud.getCounts('voice').then(c => { state.counts.voice = c || empty; if (state.goods && state.tab === 'voice') renderHot(); });
      // 登入狀態改變或個人設定儲存後，重新整理完成率（顯示「你」、檢舉按鈕）
      const refreshComp = () => { if (state.tab === 'completion' && state.goods) { state.compKey = ''; loadCompletion(); } };
      window.AzkiCloud.onUser(refreshComp);
      window.AzkiCloud.onProfileSaved(refreshComp);
    }
    load();
  }
})();
