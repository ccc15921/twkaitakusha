/* 網頁更新日記 — 更新紀錄與尚未收錄的周邊企劃清單
 * 資料來源：Google 試算表發佈的兩個 CSV 分頁（Release Note、TODO）。
 * 語言與深色模式設定和其他頁面共用。
 */
(function () {
  'use strict';

  const SHEET = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzbU98iI2i-dAfZK00DziH76BV-blVra_k7dh1ffVoGIiE-beegRPM8fwT0aV1iqD3gfc3DgLkZMHb/pub?single=true&output=csv&gid=';
  const NOTES_URL = SHEET + '2087235395';   // 欄位：date, note
  const TODO_URL = SHEET + '1081125265';    // 欄位：TODO, Website
  const LANG_KEY = 'azki-ledger-lang';
  const THEME_KEY = 'azki-ledger-theme';

  const I18N = {
    'zh-Hant': {
      'doc.title': '網頁更新日記｜開拓者の愉悅部',
      'doc.desc': '開拓者の愉悅部的更新紀錄，以及尚未收錄的周邊企劃清單。非官方粉絲製作。',
      brand: '開拓者の愉悅部',
      'nav.ledger': '繳稅紀錄簿', 'nav.voice': 'Voice 收集簿', 'nav.log': '更新日記',
      title: '網頁更新日記',
      lead: '記錄網站的更新內容，以及還沒收錄進繳稅紀錄簿的周邊企劃。',
      'notes.title': '更新紀錄',
      'todo.title': '尚未加入的周邊企劃',
      'todo.desc': '這些企劃還在整理中，之後會陸續加入繳稅紀錄簿。點企劃名稱可前往官方商店頁面。',
      'todo.ph': '搜尋企劃名稱…',
      'todo.count': n => `（共 ${n} 個）`,
      'todo.match': (a, b) => `（符合 ${a} / 共 ${b} 個）`,
      'todo.none': '沒有符合的企劃。',
      'notes.none': '目前還沒有更新紀錄。',
      loading: '讀取中…',
      failed: '讀取失敗，請稍後再試。', retry: '重新讀取',
      'theme.toDark': '切換深色模式', 'theme.toLight': '切換淺色模式',
      updated: '最後更新',
      footer1: '本站為開拓者自製的非官方粉絲網站，與 COVER 株式会社無關。',
      footer2: '所有商品圖片、名稱與相關著作權皆歸屬於 COVER 株式会社 及各權利人。'
    },
    ja: {
      'doc.title': 'サイト更新日記｜開拓者の愉悦部',
      'doc.desc': '開拓者の愉悦部の更新履歴と、まだ掲載していないグッズ企画の一覧。非公式ファンサイトです。',
      brand: '開拓者の愉悦部',
      'nav.ledger': '納税記録簿', 'nav.voice': 'ボイスコレクション', 'nav.log': '更新日記',
      title: 'サイト更新日記',
      lead: 'サイトの更新内容と、まだ納税記録簿に掲載していないグッズ企画をまとめています。',
      'notes.title': '更新履歴',
      'todo.title': '未掲載のグッズ企画',
      'todo.desc': '整理中の企画です。順次、納税記録簿に追加していきます。企画名から公式ショップのページへ移動できます。',
      'todo.ph': '企画名で検索…',
      'todo.count': n => `（全 ${n} 件）`,
      'todo.match': (a, b) => `（該当 ${a} / 全 ${b} 件）`,
      'todo.none': '該当する企画がありません。',
      'notes.none': '更新履歴はまだありません。',
      loading: '読み込み中…',
      failed: '読み込みに失敗しました。しばらくしてからお試しください。', retry: '再読み込み',
      'theme.toDark': 'ダークモードに切り替え', 'theme.toLight': 'ライトモードに切り替え',
      updated: '最終更新',
      footer1: '本サイトは開拓者による非公式のファンサイトで、カバー株式会社とは一切関係ありません。',
      footer2: '掲載している商品画像・名称およびそれらに関する著作権は、すべてカバー株式会社および各権利者に帰属します。'
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

  /* ---------------- CSV ---------------- */
  function parseCSV(text) {
    text = text.replace(/^﻿/, '');
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    const header = rows[0].map(h => h.trim().toLowerCase());
    return rows.slice(1)
      .filter(r => r.some(v => v.trim() !== ''))
      .map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])));
  }

  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => /^https?:\/\//i.test(u) ? u : '';

  // 內文：先跳脫，再把網址變成連結、換行變成 <br>
  function noteHTML(s) {
    return esc(s).replace(/https?:\/\/[^\s<]+/g, u => {
      const url = u.replace(/&amp;/g, '&');
      return `<a href="${esc(url)}" target="_blank" rel="noopener">${u}</a>`;
    }).replace(/\r?\n/g, '<br>');
  }

  function parseDate(s) {
    const m = /(\d{4})\D?(\d{1,2})\D?(\d{1,2})/.exec(s || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  }
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;

  /* ---------------- state / render ---------------- */
  const state = { notes: [], todo: [], q: '', loaded: false };

  function renderNotes() {
    const el = $('#notes');
    if (!state.notes.length) { el.innerHTML = `<li class="state">${esc(t('notes.none'))}</li>`; return; }
    el.innerHTML = state.notes.map(n => `
      <li class="tl-item">
        <time class="tl-date" datetime="${n.date ? n.date.toISOString().slice(0, 10) : ''}">${esc(n.date ? ymd(n.date) : n.rawDate)}</time>
        <div class="tl-note">${noteHTML(n.note)}</div>
      </li>`).join('');
  }

  function renderTodo() {
    const q = state.q.trim().toLowerCase();
    const list = q ? state.todo.filter(x => x.name.toLowerCase().includes(q)) : state.todo;
    $('#todo-count').textContent = q ? t('todo.match', list.length, state.todo.length) : t('todo.count', state.todo.length);
    $('#todo').innerHTML = list.length
      ? list.map(x => {
          const url = safeUrl(x.url);
          return `<li>${url
            ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(x.name)}</a>`
            : `<span>${esc(x.name)}</span>`}</li>`;
        }).join('')
      : `<li class="state">${esc(t('todo.none'))}</li>`;
  }

  function render() { renderNotes(); renderTodo(); }

  /* ---------------- i18n / theme ---------------- */
  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t('doc.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('doc.desc'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    updateThemeButton();
  }
  function setLang(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    applyStaticI18n();
    if (state.loaded) render();
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

  /* ---------------- init ---------------- */
  async function fetchCSV(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    return parseCSV(await res.text());
  }

  async function load() {
    try {
      const [notes, todo] = await Promise.all([fetchCSV(NOTES_URL), fetchCSV(TODO_URL)]);
      state.notes = notes
        .map((r, i) => ({ date: parseDate(r.date), rawDate: r.date, note: r.note, i }))
        .filter(n => n.note)
        .sort((a, b) => ((b.date ? b.date.getTime() : 0) - (a.date ? a.date.getTime() : 0)) || a.i - b.i);
      state.todo = todo.map(r => ({ name: r.todo, url: r.website })).filter(x => x.name);
      state.loaded = true;
      render();
    } catch (err) {
      const msg = `<li class="state"><p>${esc(t('failed'))}</p><button type="button" class="btn retry">${esc(t('retry'))}</button></li>`;
      $('#notes').innerHTML = msg;
      $('#todo').innerHTML = '';
      document.querySelector('#notes .retry').addEventListener('click', () => {
        $('#notes').innerHTML = `<li class="state">${esc(t('loading'))}</li>`;
        load();
      });
    }
  }

  if (typeof document !== 'undefined') {
    applyStaticI18n();
    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.addEventListener('click', () => setLang(b.dataset.lang)));
    $('#btn-theme').addEventListener('click', toggleTheme);
    let qTimer;
    $('#todo-q').addEventListener('input', e => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => { state.q = e.target.value; if (state.loaded) renderTodo(); }, 120);
    });
    load();
  }
})();
