/* 雲端同步（Supabase）：Google 登入、登出，以及把紀錄同步到雲端。
 * 需要先載入 js/vendor/supabase.js。各頁用 AzkiCloud.init({ books }) 啟用，
 * books 例：{ ledger: { get: () => owned, apply: owned => {...} } }
 *
 * 同步規則：
 * - 本機每次修改都記成「待同步」（存在 localStorage，關掉分頁也不會掉），約 1 秒後送出。
 * - 雲端是正本：登入後先送出待同步的修改，再以雲端內容更新本機。
 * - 這台裝置第一次和某個帳號連結時，比較本機與雲端：一邊是空的就直接採用另一邊，
 *   兩邊都有又不同時，讓使用者選「合併（取較大數量）」或「以雲端為準」。
 * - 登出時保留本機紀錄；下次登入會重新比較一次。
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://xellkwnyidvuhmegnypt.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_yCDkwCKRmQwFL7jGgdeXQw_Jy4kk3kt';   // 公開金鑰（可以公開）
  const LINK_KEY = 'azki-cloud-user:';         // + book：這台裝置的這本紀錄目前連結的帳號 id
  const OLD_LINK_KEY = 'azki-cloud-user';      // 第 1 階段的舊鍵（只代表繳稅紀錄簿）
  const PENDING_KEY = 'azki-cloud-pending-v1'; // 待同步的修改 { user, books: { ledger: { key: qty } } }
  const LANG_KEY = 'azki-ledger-lang';
  const PUSH_DELAY = 900;
  const PAGE = 1000;

  const I18N = {
    'zh-Hant': {
      login: 'Google 登入', logout: '登出', syncNow: '立即同步',
      'st.idle': '已同步 ✓', 'st.syncing': '同步中…', 'st.pending': n => `等待同步（${n} 筆）`,
      'st.offline': n => `離線中，連線後會同步（${n} 筆）`, 'st.error': '同步失敗，稍後會自動重試',
      'cf.title': '本機和雲端的紀錄不同',
      'cf.desc': (b, l, r) => `「${b}」：這台裝置有 ${l} 筆紀錄，雲端帳號裡有 ${r} 筆。要怎麼處理？`,
      'book.ledger': '繳稅紀錄簿', 'book.voice': 'Voice 收集簿',
      'st.signedin': '已登入。這一頁沒有需要同步的紀錄。',
      'cf.merge': '合併', 'cf.merge.desc': '兩邊的紀錄都保留，同一件取較大的數量',
      'cf.cloud': '以雲端為準', 'cf.cloud.desc': '用雲端的紀錄取代這台裝置的紀錄',
      'menu.label': '帳號選單', 'login.failed': '登入失敗，請再試一次。',
      'logout.note': '登出後，紀錄仍會保留在這台裝置。',
      'del.link': '刪除帳號', 'del.title': '刪除帳號',
      'del.desc': '會永久刪除雲端上的所有紀錄（繳稅紀錄簿、Voice 收集簿）、個人設定與帳號，無法復原。這台裝置瀏覽器裡的紀錄會保留。',
      'del.check': '我了解刪除後無法復原', 'del.ok': '永久刪除', 'del.cancel': '取消',
      'del.done': '帳號已刪除。這台裝置的紀錄仍然保留。', 'del.failed': '刪除失敗，請稍後再試。'
    },
    ja: {
      login: 'Google でログイン', logout: 'ログアウト', syncNow: '今すぐ同期',
      'st.idle': '同期済み ✓', 'st.syncing': '同期中…', 'st.pending': n => `同期待ち（${n} 件）`,
      'st.offline': n => `オフライン：接続後に同期します（${n} 件）`, 'st.error': '同期に失敗しました。自動で再試行します',
      'cf.title': 'この端末とクラウドの記録が異なります',
      'cf.desc': (b, l, r) => `「${b}」：この端末には ${l} 件、クラウドには ${r} 件の記録があります。どうしますか？`,
      'book.ledger': '納税記録簿', 'book.voice': 'ボイスコレクション',
      'st.signedin': 'ログイン中です。このページには同期する記録がありません。',
      'cf.merge': '統合する', 'cf.merge.desc': '両方の記録を残し、同じ項目は多い方の数量にします',
      'cf.cloud': 'クラウドを優先', 'cf.cloud.desc': 'この端末の記録をクラウドの記録で置き換えます',
      'menu.label': 'アカウントメニュー', 'login.failed': 'ログインに失敗しました。もう一度お試しください。',
      'logout.note': 'ログアウト後も、記録はこの端末に残ります。',
      'del.link': 'アカウントを削除', 'del.title': 'アカウントを削除',
      'del.desc': 'クラウド上のすべての記録（納税記録簿・ボイスコレクション）、個人設定、アカウントを完全に削除します。元に戻せません。この端末のブラウザ内の記録は残ります。',
      'del.check': '削除すると元に戻せないことを理解しました', 'del.ok': '完全に削除する', 'del.cancel': 'キャンセル',
      'del.done': 'アカウントを削除しました。この端末の記録はそのまま残っています。', 'del.failed': '削除に失敗しました。しばらくしてからお試しください。'
    }
  };
  const lang = () => {
    const l = document.documentElement.lang;
    if (I18N[l]) return l;
    try { const v = localStorage.getItem(LANG_KEY); if (I18N[v]) return v; } catch (e) { /* ignore */ }
    return 'zh-Hant';
  };
  const t = (k, ...a) => { const v = I18N[lang()][k]; return typeof v === 'function' ? v(...a) : (v ?? k); };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  /* ---------------- state ---------------- */
  let client = null;
  let user = null;
  let books = {};               // name → adapter
  const base = {};              // name → 最後一次和雲端一致（或已排入待同步）的內容
  let pending = { user: null, books: {} };
  let status = 'idle';          // idle | syncing | pending | offline | error
  let ready = false;            // 本次登入的初次同步完成後才接受本機修改
  let pushTimer = null, pushing = false, retryTimer = null;
  let startedFor = null;

  function loadPending() {
    try { const p = JSON.parse(store.get(PENDING_KEY)); if (p && p.books) pending = p; } catch (e) { /* ignore */ }
  }
  function savePending() { store.set(PENDING_KEY, JSON.stringify(pending)); }
  const pendingCount = () => Object.values(pending.books).reduce((a, b) => a + Object.keys(b).length, 0);
  const clone = o => Object.assign({}, o);
  const stats = o => Object.keys(o).filter(k => o[k] > 0).length;
  function sameOwned(a, b) {
    const ka = Object.keys(a).filter(k => a[k] > 0), kb = Object.keys(b).filter(k => b[k] > 0);
    return ka.length === kb.length && ka.every(k => a[k] === b[k]);
  }

  /* ---------------- 雲端讀寫 ---------------- */
  async function pullAll(book) {
    const out = {};
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await client.from('records').select('item_key,qty')
        .eq('book', book).gt('qty', 0).order('item_key').range(from, from + PAGE - 1);
      if (error) throw error;
      data.forEach(r => { out[r.item_key] = r.qty; });
      if (data.length < PAGE) break;
    }
    return out;
  }

  async function push() {
    if (!user || pushing) return;
    clearTimeout(pushTimer);
    const rows = [];
    Object.keys(pending.books).forEach(book =>
      Object.keys(pending.books[book]).forEach(k =>
        rows.push({ user_id: user.id, book, item_key: k, qty: pending.books[book][k] })));
    if (!rows.length) { setStatus('idle'); return; }
    if (!navigator.onLine) { setStatus('offline'); return; }
    pushing = true;
    setStatus('syncing');
    try {
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await client.from('records').upsert(chunk, { onConflict: 'user_id,book,item_key' });
        if (error) throw error;
        // 送出期間又被改過的就留著，下一輪再送
        chunk.forEach(r => {
          const b = pending.books[r.book];
          if (b && b[r.item_key] === r.qty) delete b[r.item_key];
        });
      }
      savePending();
      pushing = false;
      if (pendingCount()) schedulePush(); else setStatus('idle');
    } catch (e) {
      pushing = false;
      console.warn('[cloud] push failed', e);
      setStatus(navigator.onLine ? 'error' : 'offline');
      clearTimeout(retryTimer);
      retryTimer = setTimeout(push, 15000);
    }
  }
  function schedulePush() {
    clearTimeout(pushTimer);
    if (pendingCount()) setStatus('pending');
    pushTimer = setTimeout(push, PUSH_DELAY);
  }

  // 把本機目前的內容和 base 比較，差異排入待同步
  function queueDiff(book, owned) {
    const b = base[book] || {};
    const q = pending.books[book] || (pending.books[book] = {});
    new Set([...Object.keys(b), ...Object.keys(owned)]).forEach(k => {
      const now = owned[k] || 0, before = b[k] || 0;
      if (now !== before) q[k] = now;
    });
    base[book] = clone(owned);
    savePending();
  }

  function applyRemote(book, remote) {
    // 尚未送出的本機修改優先
    const merged = clone(remote);
    const q = pending.books[book] || {};
    Object.keys(q).forEach(k => { if (q[k] > 0) merged[k] = q[k]; else delete merged[k]; });
    base[book] = clone(merged);
    if (!sameOwned(merged, books[book].get())) books[book].apply(clone(merged));
  }

  /* ---------------- 登入後的初次同步 ---------------- */
  const linkKey = book => LINK_KEY + book;
  function migrateOldLink() {
    const old = store.get(OLD_LINK_KEY);
    if (old && !store.get(linkKey('ledger'))) store.set(linkKey('ledger'), old);
    if (old) store.del(OLD_LINK_KEY);
  }

  // 這台裝置第一次把某本紀錄和這個帳號連結：比較本機與雲端
  async function linkBook(book) {
    delete pending.books[book];                         // 不屬於這個帳號的待同步內容
    const local = books[book].get();
    const remote = await pullAll(book);
    base[book] = clone(remote);
    if (!stats(local) || sameOwned(local, remote)) {
      applyRemote(book, remote);
    } else if (!stats(remote)) {
      queueDiff(book, local);                           // 雲端是空的 → 上傳本機
    } else {
      const choice = await askConflict(book, stats(local), stats(remote));
      if (choice === 'merge') {
        const m = clone(remote);
        Object.keys(local).forEach(k => { m[k] = Math.max(m[k] || 0, local[k]); });
        queueDiff(book, m);
        books[book].apply(clone(m));
      } else {
        applyRemote(book, remote);
      }
    }
    savePending();
    store.set(linkKey(book), user.id);
  }

  /* ---------------- 登入後的初次同步 ---------------- */
  async function startSync() {
    if (!user || startedFor === user.id) return;
    startedFor = user.id;
    ready = false;
    migrateOldLink();
    loadPending();
    if (pending.user !== user.id) pending = { user: user.id, books: {} };
    try {
      setStatus('syncing');
      const toLink = Object.keys(books).filter(b => store.get(linkKey(b)) !== user.id);
      toLink.forEach(b => { delete pending.books[b]; });
      savePending();
      if (pendingCount()) await push();                 // 先送出上次沒送完的（含其他頁面的紀錄）
      for (const book of Object.keys(books)) {
        if (toLink.includes(book)) await linkBook(book);
        else applyRemote(book, await pullAll(book));
      }
      ready = true;
      if (pendingCount()) await push(); else setStatus('idle');
    } catch (e) {
      console.warn('[cloud] initial sync failed', e);
      startedFor = null;                                // 允許稍後重試
      setStatus(navigator.onLine ? 'error' : 'offline');
      clearTimeout(retryTimer);
      retryTimer = setTimeout(startSync, 15000);
    }
  }

  // 切回分頁時抓一次雲端的變動（其他裝置改過的會出現）
  async function refresh() {
    if (!user || !ready || pushing) return;
    try {
      if (pendingCount()) await push();
      for (const book of Object.keys(books)) applyRemote(book, await pullAll(book));
      if (!pendingCount()) setStatus('idle');
    } catch (e) { setStatus(navigator.onLine ? 'error' : 'offline'); }
  }

  /* ---------------- 衝突選擇視窗 ---------------- */
  function askConflict(book, localN, remoteN) {
    return new Promise(resolve => {
      const dlg = document.createElement('dialog');
      dlg.className = 'dlg';
      dlg.innerHTML = `<h2>${esc(t('cf.title'))}</h2><p>${esc(t('cf.desc', t('book.' + book), localN, remoteN))}</p>
        <form method="dialog" class="im-actions">
          <button type="submit" value="merge" class="btn im-opt" autofocus><b>${esc(t('cf.merge'))}</b><small>${esc(t('cf.merge.desc'))}</small></button>
          <button type="submit" value="cloud" class="btn ghost im-opt"><b>${esc(t('cf.cloud'))}</b><small>${esc(t('cf.cloud.desc'))}</small></button>
        </form>`;
      dlg.addEventListener('cancel', e => e.preventDefault());   // 一定要選一個
      dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'cloud' ? 'cloud' : 'merge'); dlg.remove(); });
      document.body.appendChild(dlg);
      dlg.showModal();
    });
  }

  /* ---------------- 畫面：右上角登入按鈕／頭像選單 ---------------- */
  let box = null;
  function setStatus(s) { status = s; renderUI(); }
  function statusText() {
    if (!Object.keys(books).length) return t('st.signedin');
    const n = pendingCount();
    if (status === 'syncing') return t('st.syncing');
    if (status === 'offline') return t('st.offline', n);
    if (status === 'error') return t('st.error');
    if (status === 'pending') return t('st.pending', n);
    return t('st.idle');
  }
  function renderUI() {
    if (!box) return;
    if (!user) {
      box.innerHTML = `<button type="button" class="btn small login-btn" data-act="login">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg>
        <span>${esc(t('login'))}</span></button>`;
      return;
    }
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || user.email || '';
    const pic = meta.avatar_url || meta.picture || '';
    const dot = !Object.keys(books).length ? 'ok' : ({ idle: 'ok', syncing: 'busy', pending: 'busy', offline: 'warn', error: 'warn' }[status] || 'ok');
    const open = box.querySelector('.auth-menu') && !box.querySelector('.auth-menu').hidden;
    box.innerHTML = `<button type="button" class="avatar-btn" data-act="menu" aria-haspopup="true" aria-expanded="${open}" aria-label="${esc(t('menu.label'))}">
        ${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer">` : `<span>${esc((name || '?').slice(0, 1).toUpperCase())}</span>`}
        <i class="sync-dot ${dot}"></i></button>
      <div class="auth-menu" ${open ? '' : 'hidden'}>
        <p class="auth-name">${esc(name)}</p>
        ${user.email && user.email !== name ? `<p class="auth-mail">${esc(user.email)}</p>` : ''}
        <p class="auth-status"><i class="sync-dot ${dot}"></i>${esc(statusText())}</p>
        ${Object.keys(books).length ? `<button type="button" class="btn ghost small" data-act="sync">${esc(t('syncNow'))}</button>` : ''}
        <button type="button" class="btn small" data-act="logout">${esc(t('logout'))}</button>
        <p class="auth-note">${esc(t('logout.note'))}</p>
        <button type="button" class="auth-del" data-act="delete">${esc(t('del.link'))}</button>
      </div>`;
    const img = box.querySelector('.avatar-btn img');
    if (img) img.addEventListener('error', () => { img.replaceWith(Object.assign(document.createElement('span'), { textContent: (name || '?').slice(0, 1).toUpperCase() })); });
  }

  async function signIn() {
    const back = location.origin + location.pathname;     // 登入後回到同一頁
    const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } });
    if (error) alert(t('login.failed'));
  }
  function confirmDelete() {
    return new Promise(resolve => {
      const dlg = document.createElement('dialog');
      dlg.className = 'dlg';
      dlg.innerHTML = `<form method="dialog"><button class="lb-close" value="cancel" aria-label="×">×</button></form>
        <h2>${esc(t('del.title'))}</h2><p>${esc(t('del.desc'))}</p>
        <label class="del-check"><input type="checkbox"> ${esc(t('del.check'))}</label>
        <form method="dialog" class="del-actions">
          <button type="submit" value="cancel" class="btn ghost">${esc(t('del.cancel'))}</button>
          <button type="submit" value="ok" class="btn btn-danger" disabled>${esc(t('del.ok'))}</button>
        </form>`;
      const cb = dlg.querySelector('input[type=checkbox]'), ok = dlg.querySelector('button[value=ok]');
      cb.addEventListener('change', () => { ok.disabled = !cb.checked; });
      dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok' && cb.checked); dlg.remove(); });
      document.body.appendChild(dlg);
      dlg.showModal();
    });
  }
  async function deleteAccount() {
    if (!(await confirmDelete())) return;
    const { error } = await client.rpc('delete_my_account');
    if (error) { console.warn('[cloud] delete failed', error); alert(t('del.failed')); return; }
    store.del(PENDING_KEY);
    pending = { user: null, books: {} };
    try { await client.auth.signOut({ scope: 'local' }); } catch (e) { /* 帳號已不存在，忽略 */ }
    clearLocalAuth();
    alert(t('del.done'));
  }
  function clearLocalAuth() {
    ['ledger', 'voice'].forEach(b => store.del(linkKey(b)));
    store.del(OLD_LINK_KEY);
    store.del(PENDING_KEY);
    pending = { user: null, books: {} };
    startedFor = null; ready = false; user = null;
    setStatus('idle');
  }

  async function signOut() {
    try { if (pendingCount()) await push(); } catch (e) { /* ignore */ }
    await client.auth.signOut();
    ['ledger', 'voice'].forEach(b => store.del(linkKey(b)));   // 下次登入重新比較本機與雲端
    store.del(OLD_LINK_KEY);
    store.del(PENDING_KEY);
    pending = { user: null, books: {} };
    startedFor = null; ready = false; user = null;
    setStatus('idle');
  }

  function mountUI() {
    const tools = document.querySelector('.nav-tools');
    if (!tools || box) return;
    box = document.createElement('div');
    box.className = 'auth';
    tools.insertBefore(box, tools.firstChild);
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'login') signIn();
      else if (act === 'logout') signOut();
      else if (act === 'delete') deleteAccount();
      else if (act === 'sync') refresh();
      else if (act === 'menu') {
        const m = box.querySelector('.auth-menu');
        m.hidden = !m.hidden;
        b.setAttribute('aria-expanded', String(!m.hidden));
      }
    });
    document.addEventListener('click', e => {
      const m = box.querySelector('.auth-menu');
      if (m && !m.hidden && !box.contains(e.target)) { m.hidden = true; renderUI(); }
    });
    document.addEventListener('keydown', e => {
      const m = box.querySelector('.auth-menu');
      if (e.key === 'Escape' && m && !m.hidden) { m.hidden = true; renderUI(); box.querySelector('.avatar-btn').focus(); }
    });
    renderUI();
  }

  /* ---------------- 對外介面 ---------------- */
  function init(opts) {
    books = (opts && opts.books) || {};
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[cloud] supabase-js 未載入，同步功能停用');
      return;
    }
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    mountUI();
    client.auth.onAuthStateChange((event, session) => {
      user = session ? session.user : null;
      // 登入完成後把網址上的 ?code= 清掉
      if (session && /[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
      renderUI();
      // 依 Supabase 建議，不在這個 callback 裡直接呼叫其他 Supabase API
      if (user) setTimeout(startSync, 0);
    });
    window.addEventListener('online', () => { if (user) { if (ready) push(); else startSync(); } });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
    window.addEventListener('pagehide', () => { if (pendingCount() && user) push(); });
  }

  // 頁面每次存檔時呼叫；未登入或初次同步尚未完成時忽略
  function localChanged(book, owned) {
    if (!user || !ready || !books[book]) return;
    queueDiff(book, owned);
    schedulePush();
  }

  window.AzkiCloud = { init, localChanged, refreshLang: renderUI };
})();
