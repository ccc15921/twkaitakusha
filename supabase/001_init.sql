-- =====================================================================
-- 開拓者の愉悅部：第 1 階段資料庫（紀錄同步＋個人資料預留）
-- 使用方式：Supabase 後台 → SQL Editor → New query → 整段貼上 → Run
-- 可以重複執行（已存在的物件會略過或更新）。
-- =====================================================================

-- ---------- 紀錄表：一列＝一個人的一件周邊／Voice ----------
create table if not exists public.records (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  book       text        not null check (book in ('ledger', 'voice')),
  item_key   text        not null check (char_length(item_key) between 1 and 200),
  qty        smallint    not null check (qty between 0 and 99),   -- 0 = 已取消（保留列，讓其他裝置知道）
  updated_at timestamptz not null default now(),
  primary key (user_id, book, item_key)
);

-- 更新時間一律由伺服器蓋章（不信任各裝置的時鐘）
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.touch_updated_at();

alter table public.records enable row level security;

-- 只開放給「已登入」的人，未登入（anon）完全不能碰
revoke all on public.records from anon;
grant select, insert, update, delete on public.records to authenticated;

drop policy if exists records_select_own on public.records;
drop policy if exists records_insert_own on public.records;
drop policy if exists records_update_own on public.records;
drop policy if exists records_delete_own on public.records;
create policy records_select_own on public.records for select to authenticated
  using ((select auth.uid()) = user_id);
create policy records_insert_own on public.records for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy records_update_own on public.records for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy records_delete_own on public.records for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- 個人資料（先預留給之後的排行榜功能） ----------
create table if not exists public.profiles (
  id               uuid        primary key references auth.users (id) on delete cascade,
  nickname         text        check (nickname is null or char_length(nickname) between 1 and 24),
  avatar_path      text,
  join_completion  boolean     not null default false,   -- 參加完成率排行榜
  join_amount      boolean     not null default false,   -- 參加金額排行榜
  count_in_stats   boolean     not null default true,    -- 計入購買人數統計
  upload_banned    boolean     not null default false,   -- 管理員停用上傳（使用者不能自己改）
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;
-- 使用者只能改這幾個欄位（upload_banned 只有管理員能改）
revoke update on public.profiles from authenticated;
grant update (nickname, avatar_path, join_completion, join_amount, count_in_stats) on public.profiles to authenticated;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 新使用者註冊時自動建立個人資料
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 已經登入過（在執行這段 SQL 之前就註冊）的使用者補建個人資料
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;
