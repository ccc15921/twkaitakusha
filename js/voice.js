/* AZKi Voice 收集簿 — AZKi 參與的官方ボイス商品清單
 * 資料來源：Google 試算表發佈的 CSV（AZKi voice 分頁）。收集紀錄存在瀏覽器 localStorage。
 * 語言與深色模式設定和繳稅紀錄簿共用。這一頁不計算金額。
 */
(function () {
  'use strict';

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzbU98iI2i-dAfZK00DziH76BV-blVra_k7dh1ffVoGIiE-beegRPM8fwT0aV1iqD3gfc3DgLkZMHb/pub?gid=1253772289&single=true&output=csv';
  const STORAGE_KEY = 'azki-voice-v1';
  const LANG_KEY = 'azki-ledger-lang';
  const THEME_KEY = 'azki-ledger-theme';

  const I18N = {
    'zh-Hant': {
      'doc.title': 'AZKi Voice 收集簿｜開拓者の愉悅部',
      'doc.desc': '整理 AZKi 參與的官方ボイス商品，記錄自己收集了哪些。非官方粉絲製作。',
      brand: '開拓者の愉悅部',
      'nav.ledger': '繳稅紀錄簿', 'nav.voice': 'Voice 收集簿', 'nav.card': '會員証', 'nav.ranking': '排行榜', 'nav.log': '更新日記',
      title: 'AZKi Voice 收集簿',
      lead: '整理 AZKi 參與的官方ボイス商品。點「收集」標記已入手的 Voice，紀錄會存在你這台裝置的瀏覽器裡；用 Google 登入後，還能同步到其他裝置。',
      'stat.count': '已收集', 'stat.unit': '件', 'stat.complete': '全收集企劃', 'stat.bar': '收集進度',
      'search.ph': '搜尋企劃或 Voice 名稱…',
      'filter.toggle': '篩選', 'filter.kind': '企劃', 'filter.year': '年份',
      'filter.status': '狀態', 'filter.sort': '排序', 'filter.record': '紀錄',
      'chip.all': '全部',
      'kind.solo': 'AZKi 個人', 'kind.group': '多人企劃', 'kind.resale': '再販',
      'status.owned': '已收集', 'status.missing': '未收集',
      'sort.desc': '新 → 舊', 'sort.asc': '舊 → 新',
      'btn.export': '匯出備份', 'btn.import': '匯入備份',
      result: (a, b) => `共 ${a} 個企劃・${b} 件 Voice`,
      empty: '找不到符合條件的 Voice。',
      'cnt.item': n => `${n} 人`, 'cnt.project': n => `${n} 人收集`, 'cnt.title': '本站開拓者中的收集人數',
      more: n => `顯示更多（還有 ${n} 個企劃）`,
      loading: 'Voice 清單讀取中…',
      failed: 'Voice 清單讀取失敗，請稍後再試。', retry: '重新讀取',
      'date.tbd': '日期未定',
      'img.none': '尚無圖片', 'img.fail': '圖片無法載入',
      'zoom.cover': n => `放大封面：${n}`,
      'link.official': '官方頁面',
      collect: '收集', collected: '✓ 已收集',
      'all.on': '全部收集', 'all.off': '全部取消',
      complete: '全收集',
      'unit.count': '件',
      'official.title': '官方連結',
      'import.confirm': '要用備份檔取代目前的 Voice 收集紀錄嗎？', 'import.fail': '匯入失敗：檔案格式不正確。',
      'theme.toLight': '切換為淺色模式', 'theme.toDark': '切換為深色模式',
      updated: '最後更新',
      footer1: '本站為開拓者自製的非官方粉絲網站，與 COVER 株式会社無關。',
      footer2: '所有商品圖片、名稱與相關著作權皆歸屬於 COVER 株式会社 及各權利人。',
    },
    ja: {
      'doc.title': 'AZKi ボイスコレクション｜開拓者の愉悅部',
      'doc.desc': 'AZKi が参加した公式ボイス商品の一覧と、自分の収集記録。非公式ファンサイトです。',
      brand: '開拓者の愉悅部',
      'nav.ledger': '納税記録簿', 'nav.voice': 'ボイスコレクション', 'nav.card': '会員証', 'nav.ranking': 'ランキング', 'nav.log': '更新日記',
      title: 'AZKi ボイスコレクション',
      lead: 'AZKi が参加した公式ボイス商品の一覧です。「収集」を押して入手済みのボイスをチェック。記録はこの端末のブラウザに保存され、Google でログインすると他の端末とも同期できます。',
      'stat.count': '収集済み', 'stat.unit': '点', 'stat.complete': 'コンプ企画', 'stat.bar': '収集の進み具合',
      'search.ph': '企画名・ボイス名で検索…',
      'filter.toggle': '絞り込み', 'filter.kind': '企画', 'filter.year': '年',
      'filter.status': '状態', 'filter.sort': '並び順', 'filter.record': '記録',
      'chip.all': 'すべて',
      'kind.solo': 'AZKi 単独', 'kind.group': '複数タレント', 'kind.resale': '再販',
      'status.owned': '収集済み', 'status.missing': '未収集',
      'sort.desc': '新しい順', 'sort.asc': '古い順',
      'btn.export': 'バックアップを書き出す', 'btn.import': 'バックアップを読み込む',
      result: (a, b) => `${a} 企画・${b} 点`,
      empty: '条件に合うボイスが見つかりません。',
      'cnt.item': n => `${n} 人`, 'cnt.project': n => `${n} 人が収集`, 'cnt.title': '本サイトの開拓者のうち収集した人数',
      more: n => `もっと見る（残り ${n} 企画）`,
      loading: 'ボイス一覧を読み込み中…',
      failed: '読み込みに失敗しました。しばらくしてからもう一度お試しください。', retry: '再読み込み',
      'date.tbd': '日付未定',
      'img.none': '画像なし', 'img.fail': '画像を読み込めません',
      'zoom.cover': n => `カバーを拡大：${n}`,
      'link.official': '公式ページ',
      collect: '収集', collected: '✓ 収集済み',
      'all.on': 'すべて収集', 'all.off': 'すべて解除',
      complete: 'コンプ',
      'unit.count': '点',
      'official.title': '公式リンク',
      'import.confirm': '現在のボイス収集記録をバックアップで置き換えますか？', 'import.fail': '読み込みに失敗しました。ファイル形式が正しくありません。',
      'theme.toLight': 'ライトモードに切り替え', 'theme.toDark': 'ダークモードに切り替え',
      updated: '最終更新',
      footer1: '本サイトは開拓者による非公式のファンサイトで、カバー株式会社とは一切関係ありません。',
      footer2: '掲載している商品画像・名称およびそれらに関する著作権は、すべてカバー株式会社および各権利者に帰属します。',
    },
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

  function parseDate(s) {
    const m = /(\d{4})\D?(\d{1,2})\D?(\d{1,2})/.exec(s || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  }

  // 紀錄鍵：企劃代號#Voice 名稱（去掉空白、全形括號轉半形，避免表格裡寫法不一致造成對不上）
  const normName = s => String(s || '').replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')');

  const SOLO_RE = /^(AZKi(?![a-z])|スターティングボイス\s*AZKi)/;
  const RESALE_RE = /再販/;

  function buildProjects(rows) {
    const map = new Map();
    rows.forEach((r, order) => {
      const code = r['project code'];
      const voice = r['voice name'];
      if (!code || !voice) return;
      let p = map.get(code);
      if (!p) {
        p = { code, name: '', dateText: '', url: '', cover: '', items: [], order };
        map.set(code, p);
      }
      if (!p.name) p.name = r['project name'];
      if (!p.dateText) p.dateText = r['date'];
      if (!p.url) p.url = r['project website link'];
      if (!p.cover) p.cover = r['picture link'];
      const key = code + '#' + normName(voice);
      if (p.items.some(it => it.key === key)) return;   // 同企劃重複的 Voice 只算一次
      p.items.push({ key, name: voice, project: code });
    });

    const projects = [...map.values()];
    projects.forEach(p => {
      p.date = parseDate(p.dateText);
      p.year = p.date ? p.date.getFullYear() : null;
      p.solo = SOLO_RE.test(p.name);
      p.resale = RESALE_RE.test(p.name);
    });
    return projects;
  }

  /* ---------------- storage ---------------- */
  function normalizeOwned(obj) {
    const out = {};
    if (!obj || typeof obj !== 'object') return out;
    Object.keys(obj).forEach(k => { if (obj[k]) out[k] = true; });
    return out;
  }
  function loadOwned() {
    try { return normalizeOwned(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch (e) { return {}; }
  }
  function saveOwned() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.owned)); } catch (e) { /* ignore */ }
    if (window.AzkiCloud) window.AzkiCloud.localChanged('voice', toQty(state.owned));   // 登入時同步到雲端
  }
  // 雲端用數量記錄（收集＝1），這一頁用 true／不存在
  function toQty(owned) {
    const out = {};
    Object.keys(owned).forEach(k => { if (owned[k]) out[k] = 1; });
    return out;
  }

  /* ---------------- helpers ---------------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = p => p.date
    ? `${p.date.getFullYear()}/${String(p.date.getMonth() + 1).padStart(2, '0')}/${String(p.date.getDate()).padStart(2, '0')}`
    : (p.dateText || t('date.tbd'));

  /* ---------------- state ---------------- */
  const PAGE_SIZE = 10;
  const state = {
    shown: PAGE_SIZE,   // 目前顯示幾個企劃
    counts: null,       // 收集人數統計
    view: [],           // 目前篩選後的企劃清單
    projects: [],
    owned: loadOwned(),
    f: { q: '', kind: 'all', year: 'all', status: 'all', sort: 'desc' },
  };

  function projectPasses(p) {
    const f = state.f;
    if (f.kind === 'solo' && !p.solo) return false;
    if (f.kind === 'group' && p.solo) return false;
    if (f.kind === 'resale' && !p.resale) return false;
    if (f.year !== 'all' && String(p.year) !== f.year) return false;
    return true;
  }
  function itemPasses(it, projectMatchesQuery) {
    const f = state.f;
    if (f.status === 'owned' && !state.owned[it.key]) return false;
    if (f.status === 'missing' && state.owned[it.key]) return false;
    if (f.q && !projectMatchesQuery && !it.name.toLowerCase().includes(f.q)) return false;
    return true;
  }
  function visibleProjects() {
    const q = state.f.q;
    const list = [];
    state.projects.forEach(p => {
      if (!projectPasses(p)) return;
      const pm = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      const items = p.items.filter(it => itemPasses(it, pm));
      if (items.length) list.push({ p, items });
    });
    const dir = state.f.sort === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const da = a.p.date ? a.p.date.getTime() : 0;
      const db = b.p.date ? b.p.date.getTime() : 0;
      return (da - db) * dir || (a.p.order - b.p.order) * dir;
    });
    return list;
  }

  /* ---------------- render ---------------- */
  function imgTag(src, alt) {
    if (!src) return `<div class="noimg">${esc(t('img.none'))}</div>`;
    return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer"
      onerror="this.outerHTML='<div class=&quot;noimg&quot;>${esc(t('img.fail'))}</div>'">`;
  }

  function projectStats(p) {
    let n = 0;
    p.items.forEach(it => { if (state.owned[it.key]) n++; });
    return { n, total: p.items.length, complete: n === p.items.length };
  }

  function countBadge(n, key) {
    if (n === null || n === undefined || n === false) return '';
    return `<span class="count-badge" title="${esc(t('cnt.title'))}">👥 ${esc(t(key, n))}</span>`;
  }
  function voiceHTML(it) {
    const owned = !!state.owned[it.key];
    return `
      <li class="voice${owned ? ' owned' : ''}" data-key="${esc(it.key)}">
        <span class="voice-name">${esc(it.name)}</span>
        ${countBadge(state.counts && (state.counts.items[it.key] || 0), 'cnt.item')}
        <button type="button" class="collect-btn" data-toggle="${esc(it.key)}" aria-pressed="${owned}">
          ${esc(owned ? t('collected') : t('collect'))}
        </button>
      </li>`;
  }

  function projectHTML(p, items) {
    const s = projectStats(p);
    const tags = [
      p.solo ? `<span class="tag solo">${esc(t('kind.solo'))}</span>` : '',
      p.resale ? `<span class="tag resale">${esc(t('kind.resale'))}</span>` : '',
      s.complete ? `<span class="tag complete">${esc(t('complete'))}</span>` : '',
    ].join('');
    const allBtn = p.items.length > 1
      ? `<button type="button" class="btn ghost small" data-all="${esc(p.code)}">${esc(t(s.complete ? 'all.off' : 'all.on'))}</button>`
      : '';
    return `
      <section class="project vproject${s.complete ? ' complete' : ''}" data-code="${esc(p.code)}">
        <div class="vhead">
          <button type="button" class="project-cover" data-zoom="${esc(p.cover)}" data-caption="${esc(p.name)}" aria-label="${esc(t('zoom.cover', p.name))}">
            ${imgTag(p.cover, p.name)}
          </button>
          <div class="project-meta">
            <div class="project-tags"><span class="project-date">${esc(fmtDate(p))}</span>${tags}${countBadge(state.counts && (state.counts.projects[p.code] || 0), 'cnt.project')}</div>
            <h2>${esc(p.name)}</h2>
            <div class="project-actions">
              <span class="project-progress"><b>${s.n}</b> / ${s.total} ${esc(t('unit.count'))}</span>
              ${p.url ? `<a class="btn ghost small" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t('link.official'))}</a>` : ''}
              ${allBtn}
            </div>
          </div>
        </div>
        <ul class="voices">${items.map(voiceHTML).join('')}</ul>
      </section>`;
  }

  function renderSummary() {
    let total = 0, n = 0, done = 0;
    state.projects.forEach(p => {
      const s = projectStats(p);
      total += s.total; n += s.n; if (s.complete) done++;
    });
    $('#stat-count').textContent = `${n} / ${total}`;
    $('#stat-complete').textContent = `${done} / ${state.projects.length}`;
    const pct = total ? Math.round(n / total * 100) : 0;
    const bar = $('#stat-bar');
    bar.setAttribute('aria-valuenow', pct);
    bar.firstElementChild.style.width = pct + '%';
  }

  function render() {
    const list = visibleProjects();
    const itemCount = list.reduce((a, x) => a + x.items.length, 0);
    $('#result-info').textContent = t('result', list.length, itemCount);
    state.view = list;
    $('#list').innerHTML = list.length
      ? list.slice(0, state.shown).map(x => projectHTML(x.p, x.items)).join('')
      : `<p class="state">${esc(t('empty'))}</p>`;
    updateMore();
    renderSummary();
  }

  /* ---------------- 分批顯示（一次 PAGE_SIZE 個企劃，往下捲或按「更多」繼續） ---------------- */
  function updateMore() {
    const wrap = $('#more-wrap');
    if (!wrap) return;
    const rest = state.view.length - state.shown;
    wrap.hidden = rest <= 0;
    if (rest > 0) $('#btn-more').textContent = t('more', rest);
  }
  function loadMore() {
    const from = state.shown;
    if (from >= state.view.length) return;
    state.shown = from + PAGE_SIZE;
    $('#list').insertAdjacentHTML('beforeend',
      state.view.slice(from, state.shown).map(x => projectHTML(x.p, x.items)).join(''));
    updateMore();
  }
  function bindMore() {
    const wrap = $('#more-wrap');
    $('#btn-more').addEventListener('click', loadMore);
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !wrap.hidden) {
        loadMore();
        io.unobserve(wrap); io.observe(wrap);   // 重新觀察：還看得到按鈕時會繼續載入
      }
    }, { rootMargin: '400px 0px' });
    io.observe(wrap);
  }

  function rerenderProject(code) {
    if (state.f.status !== 'all') return render();
    const el = document.querySelector(`.vproject[data-code="${CSS.escape(code)}"]`);
    const entry = visibleProjects().find(x => x.p.code === code);
    if (el && entry) el.outerHTML = projectHTML(entry.p, entry.items);
    renderSummary();
  }

  function refocus(selector) {
    const el = document.querySelector(selector);
    if (el) el.focus({ preventScroll: true });
  }

  function buildFilterOptions() {
    const years = [...new Set(state.projects.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
    $('#f-year').innerHTML = `<option value="all">${esc(t('chip.all'))}</option>` +
      years.map(y => `<option value="${y}">${y}</option>`).join('');
    $('#f-year').value = state.f.year;
  }

  /* ---------------- events ---------------- */
  function bindEvents() {
    bindMore();
    let qTimer;
    $('#f-q').addEventListener('input', e => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => { state.f.q = e.target.value.trim().toLowerCase(); state.shown = PAGE_SIZE; render(); }, 150);
    });

    $('#f-kind').addEventListener('click', e => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      $('#f-kind').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      state.f.kind = b.dataset.v;
      state.shown = PAGE_SIZE;
      render();
    });
    [['#f-year', 'year'], ['#f-status', 'status'], ['#f-sort', 'sort']].forEach(([sel, key]) => {
      $(sel).addEventListener('change', e => { state.f[key] = e.target.value; state.shown = PAGE_SIZE; render(); });
    });

    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.addEventListener('click', () => setLang(b.dataset.lang)));
    $('#btn-theme').addEventListener('click', toggleTheme);
    if (window.matchMedia) {
      const mq = matchMedia('(prefers-color-scheme: dark)');
      (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(updateThemeButton);
    }

    $('#toggle-filters').addEventListener('click', e => {
      const open = $('#filters').classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', open);
    });

    $('#list').addEventListener('click', e => {
      const tg = e.target.closest('[data-toggle]');
      if (tg) {
        const key = tg.dataset.toggle;
        if (state.owned[key]) delete state.owned[key]; else state.owned[key] = true;
        saveOwned();
        rerenderProject(key.slice(0, key.indexOf('#')));
        refocus(`[data-toggle="${CSS.escape(key)}"]`);
        return;
      }
      const all = e.target.closest('[data-all]');
      if (all) {
        const p = state.projects.find(x => x.code === all.dataset.all);
        if (!p) return;
        const complete = projectStats(p).complete;
        p.items.forEach(it => { if (complete) delete state.owned[it.key]; else state.owned[it.key] = true; });
        saveOwned();
        rerenderProject(p.code);
        refocus(`[data-all="${CSS.escape(p.code)}"]`);
        return;
      }
      const z = e.target.closest('[data-zoom]');
      if (z && z.dataset.zoom) {
        const lb = $('#lightbox');
        lb.querySelector('img').src = z.dataset.zoom;
        lb.querySelector('img').alt = z.dataset.caption;
        lb.querySelector('.lb-caption').textContent = z.dataset.caption;
        lb.showModal();
      }
    });
    $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') e.target.close(); });

    $('#btn-export').addEventListener('click', () => {
      const data = { app: 'azki-voice', version: 1, exportedAt: new Date().toISOString(), owned: state.owned };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `開拓者Voice收集紀錄_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('#btn-import').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const owned = data.owned || data;
        if (typeof owned !== 'object' || (data.app && data.app !== 'azki-voice')) throw new Error('格式不符');
        if (!confirm(t('import.confirm'))) return;
        state.owned = normalizeOwned(owned);
        saveOwned();
        render();
      } catch (err) {
        alert(t('import.fail'));
      } finally {
        e.target.value = '';
      }
    });
  }

  /* ---------------- language & theme ---------------- */
  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.title = t('doc.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('doc.desc'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    $('#stat-bar').setAttribute('aria-label', t('stat.bar'));
    document.querySelectorAll('.lang-switch button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    updateThemeButton();
  }
  function setLang(next) {
    if (!I18N[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    applyStaticI18n();
    if (state.projects.length) { buildFilterOptions(); render(); }
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
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#09090a' : '#f4348b');
  }
  function toggleTheme() {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    updateThemeButton();
  }

  // 從排行榜點過來（…/#item=企劃代號#Voice）：捲動到那個 Voice
  function focusFromHash() {
    const m = /^#item=(.+)$/.exec(location.hash);
    if (!m) return;
    const key = decodeURIComponent(m[1]);
    history.replaceState(null, '', location.pathname + location.search);
    const list = visibleProjects();
    const idx = list.findIndex(x => x.items.some(it => it.key === key));
    if (idx < 0) return;
    state.shown = Math.max(state.shown, Math.ceil((idx + 1) / PAGE_SIZE) * PAGE_SIZE);
    render();
    const el = document.querySelector(`.voice[data-key="${CSS.escape(key)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 2400);
    }
  }

  /* ---------------- init ---------------- */
  async function load() {
    $('#list').innerHTML = `<p class="state">${esc(t('loading'))}</p>`;
    try {
      const res = await fetch(CSV_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      state.projects = buildProjects(parseCSV(await res.text()));
      buildFilterOptions();
      render();
      focusFromHash();
    } catch (err) {
      $('#list').innerHTML = `<div class="state"><p>${esc(t('failed'))}</p>
        <button type="button" class="btn" id="retry">${esc(t('retry'))}</button></div>`;
      $('#retry').addEventListener('click', load);
    }
  }

  if (typeof document !== 'undefined') {
    applyStaticI18n();
    bindEvents();
    load();
    // 雲端同步：雲端有更新時直接套用到畫面（不經過 saveOwned，避免又被當成本機修改送回去）
    if (window.AzkiCloud) {
      window.AzkiCloud.init({
        books: {
          voice: {
            get: () => toQty(state.owned),
            apply: owned => {
              state.owned = normalizeOwned(owned);
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.owned)); } catch (e) { /* ignore */ }
              if (state.projects.length) render(); else renderSummary();
            }
          }
        }
      });
      window.AzkiCloud.getCounts('voice').then(c => { if (c) { state.counts = c; if (state.projects.length) render(); } });
    }
  }
  if (typeof module !== 'undefined') module.exports = { parseCSV, buildProjects, normName };
})();
