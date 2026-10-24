/* 管理頁：處理檢舉、檢查頭像與暱稱。
 * 所有操作都透過資料庫的 admin_* 函式，函式內會先檢查呼叫者是否在 admins 名單裡，
 * 所以就算別人打開這一頁也看不到資料、按了也沒有效果。
 */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = d => d ? new Date(d).toLocaleString('zh-TW', { hour12: false }) : '';

  const state = { profiles: [], reports: [], onlyReported: false, busy: false };
  const C = () => window.AzkiCloud.client();

  function setState(text) {
    $('#ad-state').hidden = !text;
    $('#ad-state').textContent = text || '';
    $('#ad-body').hidden = !!text;
  }

  async function load() {
    const user = window.AzkiCloud.currentUser();
    if (!user) { setState('請先用右上角的 Google 登入。'); return; }
    setState('讀取中…');
    const { data: isAdmin, error: e0 } = await C().rpc('is_admin');
    if (e0 || !isAdmin) { setState('這個帳號沒有管理員權限。'); return; }
    const [p, r] = await Promise.all([C().rpc('admin_list_profiles', { p_limit: 500 }), C().rpc('admin_list_reports')]);
    if (p.error || r.error) { console.warn(p.error || r.error); setState('讀取失敗，請稍後再試。'); return; }
    state.profiles = p.data || [];
    state.reports = r.data || [];
    setState('');
    render();
  }

  function reportsOf(id) {
    const out = { avatar: 0, nickname: 0 };
    state.reports.filter(x => x.target === id).forEach(x => { out[x.kind] = Number(x.reporters); });
    return out;
  }

  function render() {
    const list = state.onlyReported ? state.profiles.filter(p => Number(p.open_reports) > 0) : state.profiles;
    if (!list.length) { $('#ad-list').innerHTML = '<li class="state">沒有資料。</li>'; return; }
    $('#ad-list').innerHTML = list.map(p => {
      const rp = reportsOf(p.id);
      const av = window.AzkiCloud.avatarUrl(p.avatar_path);
      const flags = [
        p.avatar_hidden ? '<span class="tag warn">頭像隱藏中</span>' : '',
        p.nickname_hidden ? '<span class="tag warn">暱稱隱藏中</span>' : '',
        p.upload_banned ? '<span class="tag warn">停用上傳</span>' : '',
        p.ranking_banned ? '<span class="tag warn">移出排行榜</span>' : '',
        p.join_completion ? '<span class="tag">參加完成率榜</span>' : '',
        rp.avatar ? `<span class="tag danger">頭像檢舉 ${rp.avatar}</span>` : '',
        rp.nickname ? `<span class="tag danger">暱稱檢舉 ${rp.nickname}</span>` : ''
      ].join('');
      const btn = (act, label, cls) => `<button type="button" class="btn small ${cls || 'ghost'}" data-act="${act}" data-id="${esc(p.id)}">${label}</button>`;
      return `<li class="ad-row${Number(p.open_reports) ? ' reported' : ''}">
        <span class="rk-avatar ad-avatar${p.avatar_hidden ? ' hidden-av' : ''}">${av ? `<a href="${esc(av)}" target="_blank" rel="noopener"><img src="${esc(av)}" alt=""></a>` : '–'}</span>
        <div class="ad-main">
          <p class="ad-name">${p.nickname ? esc(p.nickname) : '<span class="muted">（未設定暱稱）</span>'}</p>
          <p class="ad-mail">${esc(p.email || '')}・更新 ${esc(fmt(p.updated_at))}</p>
          <p class="ad-flags">${flags}</p>
          <div class="ad-actions">
            ${p.avatar_path ? (p.avatar_hidden ? btn('show_avatar', '恢復頭像') : btn('hide_avatar', '隱藏頭像')) : ''}
            ${p.avatar_path ? btn('remove_avatar', '刪除頭像', 'btn-danger') : ''}
            ${p.nickname ? (p.nickname_hidden ? btn('show_nickname', '恢復暱稱') : btn('hide_nickname', '隱藏暱稱')) : ''}
            ${p.nickname ? btn('reset_nickname', '清除暱稱', 'btn-danger') : ''}
            ${p.upload_banned ? btn('unban_upload', '恢復上傳') : btn('ban_upload', '停用上傳')}
            ${p.ranking_banned ? btn('unban_ranking', '放回排行榜') : btn('ban_ranking', '移出排行榜')}
            ${Number(p.open_reports) ? btn('resolve', '檢舉結案（不處理）') : ''}
          </div>
        </div>
      </li>`;
    }).join('');
  }

  const CONFIRM = {
    remove_avatar: '確定要刪除這個人的頭像檔案？',
    reset_nickname: '確定要清除這個人的暱稱？清除後他會從完成率排行榜消失，直到重新設定暱稱。',
    ban_upload: '確定要停用這個人的頭像上傳？',
    ban_ranking: '確定要把這個人移出排行榜？'
  };

  async function act(action, id) {
    if (state.busy) return;
    if (CONFIRM[action] && !confirm(CONFIRM[action])) return;
    state.busy = true;
    try {
      if (action === 'remove_avatar') {
        const { error: se } = await C().storage.from('avatars').remove([id]);
        if (se) console.warn('[admin] storage remove failed', se);
      }
      const { error } = await C().rpc('admin_action', { p_target: id, p_action: action });
      if (error) { console.warn(error); alert('操作失敗：' + (error.message || '')); }
      await load();
    } finally { state.busy = false; }
  }

  if (typeof document !== 'undefined') {
    window.AzkiCloud.init({ books: {} });
    window.AzkiCloud.onUser(() => load());
    $('#ad-reload').addEventListener('click', load);
    $('#ad-only-reported').addEventListener('change', e => { state.onlyReported = e.target.checked; render(); });
    $('#ad-list').addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (b) act(b.dataset.act, b.dataset.id);
    });
    setTimeout(() => { if (!window.AzkiCloud.currentUser()) setState('請先用右上角的 Google 登入。'); }, 1500);
  }
})();
