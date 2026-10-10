/* 開拓者繳稅紀錄簿 — AZKi 周邊收集清單
 * 資料來源：Google 試算表發佈的 CSV。紀錄（已繳稅勾選）存在瀏覽器 localStorage。
 */
(function () {
  'use strict';

  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzbU98iI2i-dAfZK00DziH76BV-blVra_k7dh1ffVoGIiE-beegRPM8fwT0aV1iqD3gfc3DgLkZMHb/pub?gid=208155527&single=true&output=csv';
  const STORAGE_KEY = 'azki-ledger-v1';

  const LANG_KEY = 'azki-ledger-lang';
  const THEME_KEY = 'azki-ledger-theme';
  const PROJECT_TYPES = { anniversary: 1, birthday: 1 };
  const GOODS_ORDER = ['acrylic stand', 'badge', 'plushie', 'keychain'];

  const I18N = {
    'zh-Hant': {
      'doc.title': '開拓者繳稅紀錄簿｜AZKi 周邊收集清單',
      'doc.desc': '給開拓者們的 AZKi 周邊收集清單。非官方粉絲製作。',
      brand: '開拓者の愉悅部',
      'nav.ledger': '繳稅紀錄簿',
      title: '開拓者繳稅紀錄簿',
      lead: '把每一筆為 AZKi 繳的稅記下來。點「繳稅」標記已入手的周邊，紀錄只存在你這台裝置的瀏覽器裡。',
      'stat.count': '已繳稅', 'stat.unit': '件', 'stat.yen': '繳稅總額', 'stat.bar': '收集進度',
      'search.ph': '搜尋企劃或周邊名稱…',
      'filter.toggle': '篩選', 'filter.project': '企劃', 'filter.goods': '種類', 'filter.year': '年份',
      'filter.status': '狀態', 'filter.sort': '排序', 'filter.record': '紀錄',
      'chip.all': '全部',
      'ptype.anniversary': '周年紀念', 'ptype.birthday': '生日紀念', 'ptype.oversea': '海外合作', 'ptype.other': '其他',
      'gtype.acrylic stand': '壓克力立牌', 'gtype.badge': '徽章', 'gtype.plushie': '娃娃', 'gtype.keychain': '吊飾',
      'status.owned': '已繳稅', 'status.missing': '未繳稅',
      'sort.desc': '新 → 舊', 'sort.asc': '舊 → 新',
      'btn.export': '匯出備份', 'btn.import': '匯入備份',
      'result': (a, b) => `共 ${a} 個企劃・${b} 件周邊`,
      empty: '找不到符合條件的周邊。',
      loading: '稅單讀取中…',
      failed: '稅單讀取失敗，請稍後再試。', retry: '重新讀取',
      'date.tbd': '日期未定',
      'img.none': '尚無圖片', 'img.fail': '圖片無法載入',
      'zoom.item': n => `放大圖片：${n}`, 'zoom.cover': n => `放大封面：${n}`,
      'link.official': '官方頁面', 'link.x': 'X 宣傳', 'link.item': '商品頁',
      pay: '繳稅', paid: '✓ 已繳稅', stamp: '已繳稅',
      'official.title': '官方連結',
      'amount.show': '點擊顯示金額', 'amount.hide': '點擊隱藏金額',
      'qty.minus': '減少一個', 'qty.plus': '增加一個', 'qty.label': n => `已繳稅 ×${n}`,
      'stat.qty': n => `共 ${n} 個`,
      expand: n => `展開周邊（${n}）`, collapse: '收合周邊',
      'expand.all': '全部展開', 'collapse.all': '全部收合',
      'unit.count': '件',
      'import.confirm': '要用備份檔取代目前的紀錄嗎？', 'import.fail': '匯入失敗：檔案格式不正確。',
      'theme.toLight': '切換為淺色模式', 'theme.toDark': '切換為深色模式',
      footer1: '本站為開拓者自製的非官方粉絲網站，與 COVER 株式会社無關。',
      footer2: '所有商品圖片、名稱與相關著作權皆歸屬於 COVER 株式会社 及各權利人。價格以日圓標示，海外商品依當時匯率換算，僅供參考。',
    },
    ja: {
      'doc.title': '開拓者納税記録簿｜AZKi グッズコレクション',
      'doc.desc': '開拓者のための AZKi グッズ収集リスト。非公式ファンサイトです。',
      brand: '開拓者の愉悅部',
      'nav.ledger': '納税記録簿',
      title: '開拓者納税記録簿',
      lead: 'AZKi のために納めた税をひとつずつ記録しよう。「納税」を押して入手済みのグッズをチェック。記録はこの端末のブラウザ内にだけ保存されます。',
      'stat.count': '納税済み', 'stat.unit': '点', 'stat.yen': '納税総額', 'stat.bar': '収集の進み具合',
      'search.ph': '企画名・グッズ名で検索…',
      'filter.toggle': '絞り込み', 'filter.project': '企画', 'filter.goods': '種類', 'filter.year': '年',
      'filter.status': '状態', 'filter.sort': '並び順', 'filter.record': '記録',
      'chip.all': 'すべて',
      'ptype.anniversary': '周年記念', 'ptype.birthday': '誕生日記念', 'ptype.oversea': '海外コラボ', 'ptype.other': 'その他',
      'gtype.acrylic stand': 'アクリルスタンド', 'gtype.badge': '缶バッジ', 'gtype.plushie': 'ぬいぐるみ', 'gtype.keychain': 'キーホルダー',
      'status.owned': '納税済み', 'status.missing': '未納税',
      'sort.desc': '新しい順', 'sort.asc': '古い順',
      'btn.export': 'バックアップを書き出す', 'btn.import': 'バックアップを読み込む',
      'result': (a, b) => `${a} 企画・${b} 点`,
      empty: '条件に合うグッズが見つかりません。',
      loading: '納税通知書を読み込み中…',
      failed: '読み込みに失敗しました。しばらくしてからもう一度お試しください。', retry: '再読み込み',
      'date.tbd': '日付未定',
      'img.none': '画像なし', 'img.fail': '画像を読み込めません',
      'zoom.item': n => `画像を拡大：${n}`, 'zoom.cover': n => `カバーを拡大：${n}`,
      'link.official': '公式ページ', 'link.x': 'X の告知', 'link.item': '商品ページ',
      pay: '納税', paid: '✓ 納税済み', stamp: '納税済',
      'official.title': '公式リンク',
      'amount.show': 'タップで金額を表示', 'amount.hide': 'タップで金額を非表示',
      'qty.minus': '1つ減らす', 'qty.plus': '1つ増やす', 'qty.label': n => `納税済 ×${n}`,
      'stat.qty': n => `計 ${n} 個`,
      expand: n => `グッズを見る（${n}）`, collapse: '閉じる',
      'expand.all': 'すべて開く', 'collapse.all': 'すべて閉じる',
      'unit.count': '点',
      'import.confirm': '現在の記録をバックアップで置き換えますか？', 'import.fail': '読み込みに失敗しました。ファイル形式が正しくありません。',
      'theme.toLight': 'ライトモードに切り替え', 'theme.toDark': 'ダークモードに切り替え',
      footer1: '本サイトは開拓者による非公式のファンサイトで、カバー株式会社とは一切関係ありません。',
      footer2: '掲載している商品画像・名称およびそれらに関する著作権は、すべてカバー株式会社および各権利者に帰属します。価格は日本円表記で、海外商品は当時のレートで換算した参考価格です。',
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
  function parsePrice(s) {
    const n = parseInt(String(s || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  }
  const isTrue = s => /^(yes|true|y|1|是)$/i.test(String(s || '').trim());

  function buildProjects(rows) {
    const map = new Map();
    rows.forEach((r, order) => {
      const code = r['goods project code'];
      if (!code) return;
      let p = map.get(code);
      if (!p) {
        p = { code, name: '', type: '', date: null, dateText: '', url: '', xLink: '', cover: '',
              note: '', oversea: false, items: [], order };
        map.set(code, p);
      }
      const goodsName = r['goods name'];
      const isCover = r['goods index'] === '0' || !goodsName;

      // 封面列優先，其餘列只補空欄位（避免拖曳填滿造成的名稱錯誤）
      const setField = (key, val) => { if (val && (isCover || !p[key])) p[key] = val; };
      setField('name', r['goods project name']);
      setField('type', (r['project type'] || '').toLowerCase());
      setField('dateText', r['date']);
      setField('url', r['goods official website']);
      setField('xLink', r['x link']);
      setField('note', r['project note']);
      if (isTrue(r['oversea'])) p.oversea = true;

      if (isCover) {
        if (r['goods picture'] && (!p.cover || r['goods index'] === '0')) p.cover = r['goods picture'];
        return;
      }
      const idx = parseInt(r['goods index'], 10);
      p.items.push({
        key: code + '#' + (Number.isFinite(idx) ? idx : goodsName),
        index: Number.isFinite(idx) ? idx : 9999,
        name: goodsName,
        type: (r['goods type'] || '').toLowerCase(),
        price: parsePrice(r['price']),
        img: r['goods picture'],
        url: r['goods official website'],
        note: r['note'],
        project: code,
      });
    });

    const projects = [...map.values()];
    projects.forEach(p => {
      p.items.sort((a, b) => a.index - b.index);
      p.date = parseDate(p.dateText);
      p.year = p.date ? p.date.getFullYear() : null;
      if (!p.cover) p.cover = (p.items.find(i => i.img) || {}).img || '';
    });
    return projects.filter(p => p.items.length);
  }

  /* ---------------- storage ---------------- */
  const MAX_QTY = 99;
  // 舊版紀錄是 { key: true }，新版是 { key: 數量 }；兩種都接受
  function normalizeOwned(obj) {
    const out = {};
    if (!obj || typeof obj !== 'object') return out;
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      const n = v === true ? 1 : Math.floor(Number(v));
      if (Number.isFinite(n) && n >= 1) out[k] = Math.min(n, MAX_QTY);
    });
    return out;
  }
  function loadOwned() {
    try { return normalizeOwned(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch (e) { return {}; }
  }
  function saveOwned() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.owned)); } catch (e) { /* ignore */ }
  }

  /* ---------------- helpers ---------------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const yen = n => '¥' + (n || 0).toLocaleString('ja-JP');
  const fmtDate = p => p.date
    ? `${p.date.getFullYear()}/${String(p.date.getMonth() + 1).padStart(2, '0')}/${String(p.date.getDate()).padStart(2, '0')}`
    : (p.dateText || t('date.tbd'));
  const goodsLabel = type => {
    const k = 'gtype.' + type;
    const v = I18N[lang][k];
    return v || type;
  };

  /* ---------------- state ---------------- */
  const state = {
    projects: [],
    owned: loadOwned(),
    expanded: new Set(),
    showAmt: false,   // 繳稅金額預設隱藏，點擊後才顯示（不跨次保存）
    f: { q: '', ptype: 'all', gtype: 'all', year: 'all', status: 'all', sort: 'desc' },
  };

  function projectPasses(p) {
    const f = state.f;
    if (f.ptype === 'oversea' && !p.oversea) return false;
    if (f.ptype === 'other' && PROJECT_TYPES[p.type]) return false;
    if (PROJECT_TYPES[f.ptype] && p.type !== f.ptype) return false;
    if (f.year !== 'all' && String(p.year) !== f.year) return false;
    return true;
  }
  function itemPasses(it, projectMatchesQuery) {
    const f = state.f;
    if (f.gtype !== 'all' && it.type !== f.gtype) return false;
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
      return (da - db) * dir || a.p.order - b.p.order;
    });
    return list;
  }

  // 有搜尋／種類／狀態等「周邊層級」的篩選時，自動展開符合的企劃，才看得到結果
  function itemFilterActive() {
    const f = state.f;
    return !!f.q || f.gtype !== 'all' || f.status !== 'all';
  }
  function autoExpand() {
    if (itemFilterActive()) visibleProjects().forEach(x => state.expanded.add(x.p.code));
  }

  /* ---------------- render ---------------- */
  function imgTag(src, alt) {
    if (!src) return `<div class="noimg">${esc(t('img.none'))}</div>`;
    return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer"
      onerror="this.outerHTML='<div class=&quot;noimg&quot;>${esc(t('img.fail'))}</div>'">`;
  }

  const AMT_MASK = '¥ ••••';
  function updateAmounts() {
    const on = state.showAmt;
    const tip = t(on ? 'amount.hide' : 'amount.show');
    document.querySelectorAll('[data-amount]').forEach(el => {
      el.textContent = on ? yen(+el.dataset.yen || 0) : AMT_MASK;
      el.setAttribute('aria-pressed', String(on));
      el.title = tip;
      el.setAttribute('aria-label', tip);
    });
  }

  function itemHTML(it, p) {
    const qty = state.owned[it.key] || 0;
    const owned = qty > 0;
    const link = it.url && it.url !== p.url
      ? `<a class="item-link" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(t('link.item'))}</a>` : '';
    return `
      <article class="item${owned ? ' owned' : ''}" data-key="${esc(it.key)}">
        <button type="button" class="item-img" data-zoom="${esc(it.img)}" data-caption="${esc(it.name)}" aria-label="${esc(t('zoom.item', it.name))}">
          ${imgTag(it.img, it.name)}
          <span class="stamp">${esc(t('stamp'))}${qty > 1 ? ' ×' + qty : ''}</span>
        </button>
        <div class="item-body">
          ${it.type ? `<span><span class="tag">${esc(goodsLabel(it.type))}</span></span>` : ''}
          <p class="item-name" title="${esc(it.name)}">${esc(it.name)}</p>
          ${it.note ? `<p class="item-note">${esc(it.note)}</p>` : ''}
          <div class="item-foot">
            ${link}
          </div>
        </div>
        ${owned ? `
        <div class="qty" role="group" aria-label="${esc(t('qty.label', qty))}">
          <button type="button" class="qty-btn" data-step="${esc(it.key)}" data-delta="-1" aria-label="${esc(t('qty.minus'))}">−</button>
          <span class="qty-label" aria-live="polite">${esc(t('qty.label', qty))}</span>
          <button type="button" class="qty-btn" data-step="${esc(it.key)}" data-delta="1" aria-label="${esc(t('qty.plus'))}"${qty >= MAX_QTY ? ' disabled' : ''}>+</button>
        </div>` : `
        <button type="button" class="pay-btn" data-toggle="${esc(it.key)}">${esc(t('pay'))}</button>`}
      </article>`;
  }

  function projectStats(p) {
    let n = 0;
    p.items.forEach(it => { if (state.owned[it.key]) n++; });
    return { n, total: p.items.length };
  }

  function projectHTML(p, items) {
    const s = projectStats(p);
    const tags = [
      PROJECT_TYPES[p.type] ? `<span class="tag ${p.type}">${esc(t('ptype.' + p.type))}</span>` : '',
      p.oversea ? `<span class="tag oversea">${esc(t('ptype.oversea'))}</span>` : '',
    ].join('');
    const open = state.expanded.has(p.code);
    const itemsId = 'items-' + p.code;
    return `
      <section class="project${open ? ' open' : ''}" data-code="${esc(p.code)}">
        <div class="project-head">
          <button type="button" class="project-cover" data-zoom="${esc(p.cover)}" data-caption="${esc(p.name)}" aria-label="${esc(t('zoom.cover', p.name))}">
            ${imgTag(p.cover, p.name)}
          </button>
          <div class="project-meta">
            <div class="project-tags"><span class="project-date">${esc(fmtDate(p))}</span>${tags}</div>
            <h2>${esc(p.name)}</h2>
            ${p.note ? `<p class="project-note">${esc(p.note)}</p>` : ''}
            <div class="project-actions">
              <span class="project-progress"><b>${s.n}</b> / ${s.total} ${esc(t('unit.count'))}</span>
              ${p.url ? `<a class="btn ghost" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t('link.official'))}</a>` : ''}
              ${p.xLink ? `<a class="btn ghost" href="${esc(p.xLink)}" target="_blank" rel="noopener">${esc(t('link.x'))}</a>` : ''}
              <button type="button" class="btn expand-btn" data-expand="${esc(p.code)}" aria-expanded="${open}" aria-controls="${esc(itemsId)}">
                ${esc(open ? t('collapse') : t('expand', items.length))}<span class="chev" aria-hidden="true">▾</span>
              </button>
            </div>
          </div>
        </div>
        ${open ? `<div class="items" id="${esc(itemsId)}">${items.map(it => itemHTML(it, p)).join('')}</div>` : ''}
      </section>`;
  }

  function renderSummary() {
    let total = 0, n = 0, sum = 0, pieces = 0;
    state.projects.forEach(p => p.items.forEach(it => {
      total++;
      const q = state.owned[it.key] || 0;
      if (q) { n++; pieces += q; sum += (it.price || 0) * q; }
    }));
    const extra = $('#stat-qty');
    extra.hidden = pieces <= n;           // 全部都只買一個時不重複顯示
    extra.textContent = pieces > n ? '（' + t('stat.qty', pieces) + '）' : '';
    $('#stat-count').textContent = `${n} / ${total}`;
    $('#stat-yen').dataset.yen = sum;
    updateAmounts();
    const pct = total ? Math.round(n / total * 100) : 0;
    const bar = $('#stat-bar');
    bar.setAttribute('aria-valuenow', pct);
    bar.firstElementChild.style.width = pct + '%';
  }

  function render() {
    const list = visibleProjects();
    const itemCount = list.reduce((a, x) => a + x.items.length, 0);
    $('#result-info').textContent = t('result', list.length, itemCount);
    $('#list').innerHTML = list.length
      ? list.map(x => projectHTML(x.p, x.items)).join('')
      : `<p class="state">${esc(t('empty'))}</p>`;
    renderSummary();
  }

  function rerenderProject(code) {
    if (state.f.status !== 'all') return render();
    const el = document.querySelector(`.project[data-code="${CSS.escape(code)}"]`);
    const entry = visibleProjects().find(x => x.p.code === code);
    if (el && entry) el.outerHTML = projectHTML(entry.p, entry.items);
    renderSummary();
  }

  // 重新渲染後把鍵盤焦點放回同一件周邊，操作 +/- 時才不會被打斷
  function focusItem(key, selector) {
    const card = document.querySelector(`.item[data-key="${CSS.escape(key)}"]`);
    const el = card && card.querySelector(selector);
    if (el && !el.disabled) el.focus({ preventScroll: true });
  }

  function toggleExpand(code, focusBtn) {
    if (state.expanded.has(code)) state.expanded.delete(code); else state.expanded.add(code);
    rerenderProject(code);
    if (focusBtn) {
      const b = document.querySelector(`[data-expand="${CSS.escape(code)}"]`);
      if (b) b.focus({ preventScroll: true });
    }
  }

  function buildFilterOptions() {
    const types = [...new Set(state.projects.flatMap(p => p.items.map(i => i.type)).filter(Boolean))];
    types.sort((a, b) => (GOODS_ORDER.indexOf(a) + 1 || 99) - (GOODS_ORDER.indexOf(b) + 1 || 99));
    const cur = state.f.gtype;
    $('#f-gtype').innerHTML =
      `<button type="button" data-v="all" class="${cur === 'all' ? 'on' : ''}">${esc(t('chip.all'))}</button>` +
      types.map(ty => `<button type="button" data-v="${esc(ty)}" class="${cur === ty ? 'on' : ''}">${esc(goodsLabel(ty))}</button>`).join('');

    const years = [...new Set(state.projects.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
    $('#f-year').innerHTML = `<option value="all">${esc(t('chip.all'))}</option>` +
      years.map(y => `<option value="${y}">${y}</option>`).join('');
    $('#f-year').value = state.f.year;
  }

  /* ---------------- events ---------------- */
  function bindEvents() {
    let qTimer;
    $('#f-q').addEventListener('input', e => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => { state.f.q = e.target.value.trim().toLowerCase(); autoExpand(); render(); }, 150);
    });

    [['#f-ptype', 'ptype'], ['#f-gtype', 'gtype']].forEach(([sel, key]) => {
      $(sel).addEventListener('click', e => {
        const b = e.target.closest('button[data-v]');
        if (!b) return;
        $(sel).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        state.f[key] = b.dataset.v;
        if (key === 'gtype') autoExpand();
        render();
      });
    });
    [['#f-year', 'year'], ['#f-status', 'status'], ['#f-sort', 'sort']].forEach(([sel, key]) => {
      $(sel).addEventListener('change', e => {
        state.f[key] = e.target.value;
        if (key === 'status') autoExpand();
        render();
      });
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

    $('#btn-expand-all').addEventListener('click', () => {
      visibleProjects().forEach(x => state.expanded.add(x.p.code));
      render();
    });
    $('#btn-collapse-all').addEventListener('click', () => { state.expanded.clear(); render(); });

    document.addEventListener('click', e => {
      if (!e.target.closest('[data-amount]')) return;
      state.showAmt = !state.showAmt;
      updateAmounts();
    });

    $('#list').addEventListener('click', e => {
      const ex = e.target.closest('[data-expand]');
      if (ex) { toggleExpand(ex.dataset.expand, true); return; }
      const tg = e.target.closest('[data-toggle]');
      if (tg) {
        const key = tg.dataset.toggle;
        state.owned[key] = 1;
        saveOwned();
        rerenderProject(key.slice(0, key.lastIndexOf('#')));
        focusItem(key, '[data-step][data-delta="1"]');
        return;
      }
      const st = e.target.closest('[data-step]');
      if (st) {
        const key = st.dataset.step, delta = +st.dataset.delta;
        const next = Math.max(0, Math.min(MAX_QTY, (state.owned[key] || 0) + delta));
        if (next) state.owned[key] = next; else delete state.owned[key];
        saveOwned();
        rerenderProject(key.slice(0, key.lastIndexOf('#')));
        focusItem(key, next ? `[data-step][data-delta="${delta}"]` : '[data-toggle]');
        return;
      }
      const z = e.target.closest('[data-zoom]');
      if (z && z.dataset.zoom) {
        const lb = $('#lightbox');
        lb.querySelector('img').src = z.dataset.zoom;
        lb.querySelector('img').alt = z.dataset.caption;
        lb.querySelector('.lb-caption').textContent = z.dataset.caption;
        lb.showModal();
        return;
      }
      // 點企劃卡片上的空白處也能展開／收合
      const head = e.target.closest('.project-head');
      if (head && !e.target.closest('a, button')) {
        toggleExpand(head.closest('.project').dataset.code, false);
      }
    });
    $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') e.target.close(); });

    $('#btn-export').addEventListener('click', () => {
      const data = { app: 'azki-ledger', version: 2, exportedAt: new Date().toISOString(), owned: state.owned };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `開拓者繳稅紀錄_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    $('#btn-import').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const owned = data.owned || data;
        if (typeof owned !== 'object') throw new Error('格式不符');
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
  async function load() {
    $('#list').innerHTML = `<p class="state">${esc(t('loading'))}</p>`;
    try {
      const res = await fetch(CSV_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      state.projects = buildProjects(parseCSV(await res.text()));
      buildFilterOptions();
      render();
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
  }
  if (typeof module !== 'undefined') module.exports = { parseCSV, buildProjects };
})();
