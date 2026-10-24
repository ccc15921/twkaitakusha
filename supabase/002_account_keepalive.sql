-- =====================================================================
-- 開拓者の愉悅部：第 3 階段（刪除帳號、保持專案活躍）
-- 使用方式：Supabase 後台 → SQL Editor → New query → 整段貼上 → Run（可重複執行）
-- =====================================================================

-- ---------- 刪除自己的帳號 ----------
-- 刪掉 auth.users 裡自己的那一列；records、profiles 設了 on delete cascade，會一起刪除。
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = uid;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- 保持活躍 ----------
-- GitHub Actions 每 3 天呼叫一次，避免免費專案閒置一週被暫停。只回傳現在時間，不碰任何資料。
create or replace function public.keepalive()
returns timestamptz language sql stable set search_path = '' as $$
  select now()
$$;

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
