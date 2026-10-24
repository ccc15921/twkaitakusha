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
      'nav.ledger': '繳稅紀錄簿', 'nav.voice': 'Voice 收集簿', 'nav.card': '會員証', 'nav.log': '更新日記',
      title: '開拓者繳稅紀錄簿',
      lead: '將每一筆贊助 AZKi Sololive 的繳稅記錄下來。',
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
      'result': (a, b) => `目前共收錄 ${a} 個企劃，${b} 件周邊`,
      'result.match': (a, b) => `符合 ${a} 個企劃、${b} 件周邊`,
      'result.yen': '符合範圍的繳稅金額',
      empty: '找不到符合條件的周邊。',
      more: n => `顯示更多（還有 ${n} 個企劃）`,
      loading: '稅單讀取中…',
      failed: '稅單讀取失敗，請稍後再試。', retry: '重新讀取',
      'date.tbd': '日期未定',
      'img.none': '尚無圖片', 'img.fail': '圖片無法載入',
      'zoom.item': n => `放大圖片：${n}`, 'zoom.cover': n => `放大封面：${n}`,
      'link.official': '官方頁面', 'link.x': 'X 宣傳', 'link.item': '商品頁',
      pay: '繳稅', paid: '✓ 已繳稅', stamp: '已繳稅',
      'official.title': '官方連結',
      'btn.transfer': '轉移到其他裝置',
      'tr.title': '轉移紀錄', 'tr.desc': '在另一台裝置用相機掃描 QR Code，或開啟下方連結，確認後即可匯入。',
      'tr.warn': '連結內含你的收藏紀錄（沒有金額），只傳給你自己，不要公開張貼。',
      'tr.copy': '複製連結', 'tr.copied': '已複製', 'tr.share': '分享',
      'tr.empty': '目前還沒有紀錄可以轉移。', 'tr.noqr': '紀錄太多，QR Code 放不下，請改用連結或匯出備份。',
      'tr.link': '轉移連結',
      'im.title': '匯入紀錄',
      'im.found': (k, n) => `收到 ${k} 種、共 ${n} 個的紀錄。`,
      'im.local': k => `這台裝置目前已有 ${k} 種紀錄。`,
      'im.merge': '合併（推薦）', 'im.merge.desc': '同一件周邊取較大的數量，不會刪掉這台裝置原有的紀錄。',
      'im.replace': '取代', 'im.replace.desc': '用收到的紀錄完全覆蓋這台裝置。',
      'im.import': '匯入', 'im.import.desc': '把收到的紀錄存到這台裝置。',
      'im.cancel': '取消',
      'im.bad': '紀錄無法讀取，連結可能不完整或已損壞。',
      'im.unsupported': '這個瀏覽器不支援讀取這種連結，請改用匯出備份檔。',
      'amount.show': '點擊顯示金額', 'amount.hide': '點擊隱藏金額',
      'qty.minus': '減少一個', 'qty.plus': '增加一個', 'qty.label': n => `已繳稅 ×${n}`,
      'stat.qty': n => `共 ${n} 個`,
      expand: '展開', collapse: '收合',
      'expand.all': '全部展開', 'collapse.all': '全部收合',
      'unit.count': '件',
      'import.confirm': '要用備份檔取代目前的紀錄嗎？', 'import.fail': '匯入失敗：檔案格式不正確。',
      'theme.toLight': '切換為淺色模式', 'theme.toDark': '切換為深色模式',
      updated: '最後更新',
      footer1: '本站為開拓者自製的非官方粉絲網站，與 COVER 株式会社無關。',
      footer2: '所有商品圖片、名稱與相關著作權皆歸屬於 COVER 株式会社 及各權利人。價格以日圓標示，海外商品依當時匯率換算，僅供參考。',
    },
    ja: {
      'doc.title': '開拓者納税記録簿｜AZKi グッズコレクション',
      'doc.desc': '開拓者のための AZKi グッズ収集リスト。非公式ファンサイトです。',
      brand: '開拓者の愉悅部',
      'nav.ledger': '納税記録簿', 'nav.voice': 'ボイスコレクション', 'nav.card': '会員証', 'nav.log': '更新日記',
      title: '開拓者納税記録簿',
      lead: 'AZKi の Sololive を応援するために納めた税を、ひとつずつ記録しよう。',
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
      'result': (a, b) => `現在 ${a} 企画・${b} 点を掲載中`,
      'result.match': (a, b) => `該当 ${a} 企画・${b} 点`,
      'result.yen': '該当分の納税額',
      empty: '条件に合うグッズが見つかりません。',
      more: n => `もっと見る（残り ${n} 企画）`,
      loading: '納税通知書を読み込み中…',
      failed: '読み込みに失敗しました。しばらくしてからもう一度お試しください。', retry: '再読み込み',
      'date.tbd': '日付未定',
      'img.none': '画像なし', 'img.fail': '画像を読み込めません',
      'zoom.item': n => `画像を拡大：${n}`, 'zoom.cover': n => `カバーを拡大：${n}`,
      'link.official': '公式ページ', 'link.x': 'X の告知', 'link.item': '商品ページ',
      pay: '納税', paid: '✓ 納税済み', stamp: '納税済',
      'official.title': '公式リンク',
      'btn.transfer': '他の端末に引き継ぐ',
      'tr.title': '記録を引き継ぐ', 'tr.desc': '別の端末でカメラでQRコードを読み取るか、下のリンクを開いてください。確認後に読み込まれます。',
      'tr.warn': 'リンクにはコレクションの記録（金額なし）が含まれます。自分だけに送り、公開しないでください。',
      'tr.copy': 'リンクをコピー', 'tr.copied': 'コピーしました', 'tr.share': '共有',
      'tr.empty': '引き継ぐ記録がまだありません。', 'tr.noqr': '記録が多くQRコードに収まりません。リンクまたはバックアップをご利用ください。',
      'tr.link': '引き継ぎリンク',
      'im.title': '記録の読み込み',
      'im.found': (k, n) => `${k} 種類・計 ${n} 点の記録を受け取りました。`,
      'im.local': k => `この端末には現在 ${k} 種類の記録があります。`,
      'im.merge': '統合（おすすめ）', 'im.merge.desc': '同じグッズは多い方の数を採用し、この端末の記録は消しません。',
      'im.replace': '置き換え', 'im.replace.desc': '受け取った記録でこの端末の記録を上書きします。',
      'im.import': '読み込む', 'im.import.desc': '受け取った記録をこの端末に保存します。',
      'im.cancel': 'キャンセル',
      'im.bad': '記録を読み込めません。リンクが不完全か壊れている可能性があります。',
      'im.unsupported': 'このブラウザではこの形式のリンクを開けません。バックアップファイルをご利用ください。',
      'amount.show': 'タップで金額を表示', 'amount.hide': 'タップで金額を非表示',
      'qty.minus': '1つ減らす', 'qty.plus': '1つ増やす', 'qty.label': n => `納税済 ×${n}`,
      'stat.qty': n => `計 ${n} 個`,
      expand: '開く', collapse: '閉じる',
      'expand.all': 'すべて開く', 'collapse.all': 'すべて閉じる',
      'unit.count': '点',
      'import.confirm': '現在の記録をバックアップで置き換えますか？', 'import.fail': '読み込みに失敗しました。ファイル形式が正しくありません。',
      'theme.toLight': 'ライトモードに切り替え', 'theme.toDark': 'ダークモードに切り替え',
      updated: '最終更新',
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
    if (window.AzkiCloud) window.AzkiCloud.localChanged('ledger', state.owned);   // 登入時同步到雲端
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
  const PAGE_SIZE = 10;
  const state = {
    shown: PAGE_SIZE,   // 目前顯示幾個企劃
    view: [],           // 目前篩選後的企劃清單
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

  function renderResultInfo(list) {
    const itemCount = list.reduce((a, x) => a + x.items.length, 0);
    const allP = state.projects.filter(p => p.items.length);
    const allItems = allP.reduce((a, p) => a + p.items.length, 0);
    let html = esc(t('result', allP.length, allItems));
    if (list.length !== allP.length || itemCount !== allItems) {
      // 篩選時，另外顯示符合範圍內的繳稅金額（預設隱藏，點擊顯示，和上方總額同步開關）
      const sub = list.reduce((a, x) => a + x.items.reduce((b, it) => b + (it.price || 0) * (state.owned[it.key] || 0), 0), 0);
      html += '｜' + esc(t('result.match', list.length, itemCount)) + '｜' + esc(t('result.yen')) +
        ' <button type="button" class="amount" data-amount data-yen="' + sub + '"></button>';
    }
    $('#result-info').innerHTML = html;
    updateAmounts();
  }
  function render() {
    const list = visibleProjects();
    renderResultInfo(list);
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
    const el = document.querySelector(`.project[data-code="${CSS.escape(code)}"]`);
    const entry = visibleProjects().find(x => x.p.code === code);
    if (el && entry) el.outerHTML = projectHTML(entry.p, entry.items);
    renderResultInfo(visibleProjects());
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
    bindMore();
    let qTimer;
    $('#f-q').addEventListener('input', e => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => { state.f.q = e.target.value.trim().toLowerCase(); autoExpand(); state.shown = PAGE_SIZE; render(); }, 150);
    });

    [['#f-ptype', 'ptype'], ['#f-gtype', 'gtype']].forEach(([sel, key]) => {
      $(sel).addEventListener('click', e => {
        const b = e.target.closest('button[data-v]');
        if (!b) return;
        $(sel).querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        state.f[key] = b.dataset.v;
        if (key === 'gtype') autoExpand();
        state.shown = PAGE_SIZE;
        render();
      });
    });
    [['#f-year', 'year'], ['#f-status', 'status'], ['#f-sort', 'sort']].forEach(([sel, key]) => {
      $(sel).addEventListener('change', e => {
        state.f[key] = e.target.value;
        if (key === 'status') autoExpand();
        state.shown = PAGE_SIZE;
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

    $('#btn-transfer').addEventListener('click', openTransfer);
    $('#tr-copy').addEventListener('click', copyTransferLink);
    $('#tr-share').addEventListener('click', () => {
      const url = $('#tr-link').value;
      if (url && navigator.share) navigator.share({ title: t('title'), url }).catch(() => {});
    });
    $('#tr-link').addEventListener('focus', e => e.target.select());
    ['#transfer', '#import-dlg'].forEach(sel =>
      $(sel).addEventListener('click', e => { if (e.target.id === sel.slice(1)) e.target.close(); }));
    window.addEventListener('hashchange', handleHash);

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
        await importFlow(normalizeOwned(owned));
      } catch (err) {
        alert(t('import.fail'));
      } finally {
        e.target.value = '';
      }
    });
  }

  /* ---------------- 轉移紀錄（連結 + QR Code）與匯入 ---------------- */
  const TR = window.AzkiTransfer;

  function ownedStats(o) {
    let kinds = 0, pieces = 0;
    Object.keys(o).forEach(k => { kinds++; pieces += o[k]; });
    return { kinds, pieces };
  }
  function mergeOwned(a, b) {
    const out = Object.assign({}, a);
    Object.keys(b).forEach(k => { out[k] = Math.max(out[k] || 0, b[k]); });
    return normalizeOwned(out);
  }
  const pageBase = () => location.href.replace(/[#?].*$/, '');

  async function openTransfer() {
    const dlg = $('#transfer'), box = $('#tr-qr'), msg = $('#tr-msg'), row = $('#tr-row');
    box.innerHTML = ''; box.hidden = true; msg.hidden = true; row.hidden = true;
    $('#tr-copy').textContent = t('tr.copy');
    if (!ownedStats(state.owned).kinds) {
      msg.textContent = t('tr.empty'); msg.hidden = false;
    } else {
      const link = pageBase() + '#t=' + await TR.encode(state.owned);
      $('#tr-link').value = link;
      row.hidden = false;
      $('#tr-share').hidden = !navigator.share;
      const svg = TR.qrSvg(link);
      if (svg) { box.innerHTML = svg; box.hidden = false; }
      else { msg.textContent = t('tr.noqr'); msg.hidden = false; }
    }
    if (!dlg.open) dlg.showModal();
  }
  async function copyTransferLink() {
    const input = $('#tr-link'), btn = $('#tr-copy');
    try { await navigator.clipboard.writeText(input.value); }
    catch (e) { input.select(); try { document.execCommand('copy'); } catch (e2) { /* ignore */ } }
    btn.textContent = t('tr.copied');
    setTimeout(() => { btn.textContent = t('tr.copy'); }, 1500);
  }

  // 問使用者要合併、取代還是取消；回傳 'merge' | 'replace' | 'cancel'
  function askImport(incoming) {
    const dlg = $('#import-dlg');
    const inc = ownedStats(incoming), loc = ownedStats(state.owned);
    $('#im-summary').textContent = t('im.found', inc.kinds, inc.pieces) + (loc.kinds ? ' ' + t('im.local', loc.kinds) : '');
    const empty = loc.kinds === 0;                       // 這台裝置沒有紀錄時，只需要「匯入」一個選項
    $('#im-merge-title').textContent = t(empty ? 'im.import' : 'im.merge');
    $('#im-merge-desc').textContent = t(empty ? 'im.import.desc' : 'im.merge.desc');
    $('#im-replace').hidden = empty;
    dlg.returnValue = '';
    return new Promise(resolve => {
      dlg.addEventListener('close', () => resolve(dlg.returnValue || 'cancel'), { once: true });
      dlg.showModal();
    });
  }
  async function importFlow(incoming) {
    if (!ownedStats(incoming).kinds) { alert(t('im.bad')); return; }
    const choice = await askImport(incoming);
    if (choice === 'merge') state.owned = mergeOwned(state.owned, incoming);
    else if (choice === 'replace') state.owned = incoming;
    else return;
    saveOwned();
    if (state.projects.length) render();
  }

  // 開啟 …/#t=payload 這種轉移連結時，先清掉網址上的 #，再詢問要不要匯入
  async function handleHash() {
    const m = /^#t=([A-Za-z0-9_.-]+)/.exec(location.hash);
    if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);
    let incoming;
    try { incoming = normalizeOwned(await TR.decode(m[1])); }
    catch (e) { alert(t(e.message === 'unsupported' ? 'im.unsupported' : 'im.bad')); return; }
    await importFlow(incoming);
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
    $('#tr-link').setAttribute('aria-label', t('tr.link'));
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
    handleHash();
    // 雲端同步：雲端有更新時直接套用到畫面（不經過 saveOwned，避免又被當成本機修改送回去）
    if (window.AzkiCloud) {
      window.AzkiCloud.init({
        books: {
          ledger: {
            get: () => Object.assign({}, state.owned),
            apply: owned => {
              state.owned = normalizeOwned(owned);
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.owned)); } catch (e) { /* ignore */ }
              if (state.projects.length) render(); else renderSummary();
            }
          }
        }
      });
    }
  }
  if (typeof module !== 'undefined') module.exports = { parseCSV, buildProjects };
})();
