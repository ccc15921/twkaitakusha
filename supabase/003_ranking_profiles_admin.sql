-- =====================================================================
-- 開拓者の愉悅部：第 4＋5 階段
--   購買人數統計、個人設定（暱稱／頭像）、Voice 完成率排行榜、檢舉、管理員
-- 使用方式：Supabase 後台 → SQL Editor → New query → 整段貼上 → Run（可重複執行）
-- 需先執行過 001_init.sql、002_account_keepalive.sql。
-- =====================================================================

-- ---------- 個人資料：新增管理用欄位（使用者自己不能改） ----------
alter table public.profiles add column if not exists avatar_hidden   boolean not null default false;  -- 頭像被隱藏（檢舉或管理員）
alter table public.profiles add column if not exists nickname_hidden boolean not null default false;  -- 暱稱被隱藏
alter table public.profiles add column if not exists ranking_banned  boolean not null default false;  -- 移出排行榜

-- 使用者能改的欄位（重新設定一次，確保管理欄位不在其中）
revoke update on public.profiles from authenticated;
grant update (nickname, avatar_path, join_completion, join_amount, count_in_stats) on public.profiles to authenticated;

-- 暱稱去頭尾空白；頭像路徑只能指向自己的檔案；換新頭像／新暱稱時解除隱藏並結案舊檢舉
create or replace function public.profiles_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.nickname is not null then
    new.nickname := nullif(btrim(new.nickname), '');
  end if;
  if new.avatar_path is not null and new.avatar_path not like new.id::text || '?v=%' then
    raise exception 'invalid avatar_path';
  end if;
  -- 只有本人修改時才自動解除隱藏（管理員函式會自己設定這些欄位）
  if coalesce(current_setting('app.admin_action', true), '') <> 'on' then
    if new.avatar_path is distinct from old.avatar_path and new.avatar_path is not null then
      new.avatar_hidden := false;
      update public.reports set resolved = true where target = new.id and kind = 'avatar' and not resolved;
    end if;
    if new.nickname is distinct from old.nickname and new.nickname is not null then
      new.nickname_hidden := false;
      update public.reports set resolved = true where target = new.id and kind = 'nickname' and not resolved;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- ---------- 管理員 ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------- 檢舉（只針對頭像／暱稱） ----------
create table if not exists public.reports (
  id         bigint generated always as identity primary key,
  reporter   uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  target     uuid        not null references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('avatar', 'nickname')),
  created_at timestamptz not null default now(),
  resolved   boolean     not null default false,
  unique (reporter, target, kind)
);
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant insert (target, kind) on public.reports to authenticated;

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports for insert to authenticated
  with check ((select auth.uid()) = reporter and reporter <> target);

-- 現在才建立觸發器（需要 reports 表存在）
drop trigger if exists profiles_touch on public.profiles;
drop trigger if exists profiles_before_update on public.profiles;
create trigger profiles_before_update before update on public.profiles
  for each row execute function public.profiles_before_update();

-- 被 3 個不同的人檢舉（未結案）時自動隱藏
create or replace function public.reports_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  select count(distinct reporter) into n from public.reports
    where target = new.target and kind = new.kind and not resolved;
  if n >= 3 then
    perform set_config('app.admin_action', 'on', true);
    if new.kind = 'avatar' then
      update public.profiles set avatar_hidden = true where id = new.target;
    else
      update public.profiles set nickname_hidden = true where id = new.target;
    end if;
    perform set_config('app.admin_action', '', true);
  end if;
  return new;
end $$;
drop trigger if exists reports_after_insert on public.reports;
create trigger reports_after_insert after insert on public.reports
  for each row execute function public.reports_after_insert();

-- ---------- 頭像檔案（Storage：avatars bucket） ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 102400, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 檔名＝使用者 id（每人只有一個檔案，上傳即覆蓋）；被停用上傳的人不能上傳
drop policy if exists avatars_select_own on storage.objects;
drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;
drop policy if exists avatars_delete_admin on storage.objects;
create policy avatars_select_own on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text);
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text
    and not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.upload_banned));
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text
    and not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.upload_banned));
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text);
create policy avatars_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (select public.is_admin()));

-- ---------- 購買人數統計（匿名，排除選擇不計入統計的人） ----------
create or replace function public.get_item_counts(p_book text)
returns table (item_key text, n bigint)
language sql stable security definer set search_path = '' as $$
  select r.item_key, count(*)::bigint
  from public.records r
  join public.profiles p on p.id = r.user_id
  where r.book = p_book and r.qty > 0 and p.count_in_stats
  group by r.item_key
$$;

create or replace function public.get_project_counts(p_book text)
returns table (project text, n bigint)
language sql stable security definer set search_path = '' as $$
  select split_part(r.item_key, '#', 1), count(distinct r.user_id)::bigint
  from public.records r
  join public.profiles p on p.id = r.user_id
  where r.book = p_book and r.qty > 0 and p.count_in_stats
  group by 1
$$;

revoke all on function public.get_item_counts(text) from public;
revoke all on function public.get_project_counts(text) from public;
grant execute on function public.get_item_counts(text) to anon, authenticated;
grant execute on function public.get_project_counts(text) to anon, authenticated;

-- ---------- Voice 完成率排行榜 ----------
-- 網頁把「目前要計算的 Voice 清單」（全部或某年度）傳進來，伺服器只算參加者收集了其中幾個。
create or replace function public.get_voice_completion(p_keys text[], p_limit int default 100)
returns table (user_id uuid, nickname text, avatar_path text, collected bigint, last_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id,
         case when p.nickname_hidden then null else p.nickname end,
         case when p.avatar_hidden then null else p.avatar_path end,
         count(r.item_key)::bigint,
         max(r.updated_at)
  from public.profiles p
  join public.records r on r.user_id = p.id and r.book = 'voice' and r.qty > 0 and r.item_key = any (p_keys)
  where p.join_completion and not p.ranking_banned and p.nickname is not null
  group by p.id
  order by count(r.item_key) desc, max(r.updated_at) asc
  limit least(greatest(coalesce(p_limit, 100), 1), 500)
$$;
revoke all on function public.get_voice_completion(text[], int) from public;
grant execute on function public.get_voice_completion(text[], int) to anon, authenticated;

-- 自己的個人資料（含管理欄位，只讀）
create or replace function public.get_my_profile()
returns setof public.profiles
language sql stable security definer set search_path = '' as $$
  select * from public.profiles where id = auth.uid()
$$;
revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

-- ---------- 管理員用函式 ----------
create or replace function public.admin_list_profiles(p_limit int default 200)
returns table (id uuid, email text, nickname text, avatar_path text, avatar_hidden boolean,
               nickname_hidden boolean, upload_banned boolean, ranking_banned boolean,
               join_completion boolean, updated_at timestamptz, open_reports bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select p.id, u.email::text, p.nickname, p.avatar_path, p.avatar_hidden, p.nickname_hidden,
           p.upload_banned, p.ranking_banned, p.join_completion, p.updated_at,
           (select count(*) from public.reports r where r.target = p.id and not r.resolved)
    from public.profiles p join auth.users u on u.id = p.id
    where p.avatar_path is not null or p.nickname is not null
       or exists (select 1 from public.reports r where r.target = p.id and not r.resolved)
    order by (select count(*) from public.reports r where r.target = p.id and not r.resolved) desc,
             p.updated_at desc
    limit least(greatest(coalesce(p_limit, 200), 1), 1000);
end $$;

create or replace function public.admin_list_reports()
returns table (target uuid, kind text, reporters bigint, first_at timestamptz, last_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return query
    select r.target, r.kind, count(*)::bigint, min(r.created_at), max(r.created_at)
    from public.reports r where not r.resolved
    group by r.target, r.kind
    order by count(*) desc, max(r.created_at) desc;
end $$;

-- action：hide_avatar / show_avatar / remove_avatar / hide_nickname / show_nickname / reset_nickname /
--         ban_upload / unban_upload / ban_ranking / unban_ranking / resolve
create or replace function public.admin_action(p_target uuid, p_action text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  perform set_config('app.admin_action', 'on', true);
  case p_action
    when 'hide_avatar'    then update public.profiles set avatar_hidden = true where id = p_target;
    when 'show_avatar'    then update public.profiles set avatar_hidden = false where id = p_target;
                               update public.reports set resolved = true where target = p_target and kind = 'avatar';
    when 'remove_avatar'  then update public.profiles set avatar_path = null, avatar_hidden = false where id = p_target;
                               update public.reports set resolved = true where target = p_target and kind = 'avatar';
    when 'hide_nickname'  then update public.profiles set nickname_hidden = true where id = p_target;
    when 'show_nickname'  then update public.profiles set nickname_hidden = false where id = p_target;
                               update public.reports set resolved = true where target = p_target and kind = 'nickname';
    when 'reset_nickname' then update public.profiles set nickname = null, nickname_hidden = false where id = p_target;
                               update public.reports set resolved = true where target = p_target and kind = 'nickname';
    when 'ban_upload'     then update public.profiles set upload_banned = true where id = p_target;
    when 'unban_upload'   then update public.profiles set upload_banned = false where id = p_target;
    when 'ban_ranking'    then update public.profiles set ranking_banned = true where id = p_target;
    when 'unban_ranking'  then update public.profiles set ranking_banned = false where id = p_target;
    when 'resolve'        then update public.reports set resolved = true where target = p_target;
    else raise exception 'unknown action %', p_action;
  end case;
  perform set_config('app.admin_action', '', true);
end $$;

revoke all on function public.admin_list_profiles(int) from public, anon;
revoke all on function public.admin_list_reports() from public, anon;
revoke all on function public.admin_action(uuid, text) from public, anon;
grant execute on function public.admin_list_profiles(int) to authenticated;
grant execute on function public.admin_list_reports() to authenticated;
grant execute on function public.admin_action(uuid, text) to authenticated;

-- ---------- 設定管理員（把下面的 email 換成你的，取消註解後執行一次） ----------
-- insert into public.admins (user_id) select id from auth.users where email = 'your-email@gmail.com'
--   on conflict do nothing;
