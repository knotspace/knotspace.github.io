-- KNOT 投稿者アカウント / 下書きワークフロー
-- Supabase Dashboard > SQL Editor で実行
create table if not exists public.knot_writer_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.knot_submissions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 300),
  category text not null default 'その他',
  body text not null default '' check (char_length(body) <= 50000),
  status text not null default 'draft' check (status in ('draft','submitted','reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.knot_writer_roles enable row level security;
alter table public.knot_submissions enable row level security;

create or replace function public.is_knot_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.knot_admins where user_id = auth.uid()) $$;
create or replace function public.is_knot_writer()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.knot_writer_roles where user_id = auth.uid()) $$;

revoke all on function public.is_knot_admin() from public;
revoke all on function public.is_knot_writer() from public;
grant execute on function public.is_knot_admin() to authenticated;
grant execute on function public.is_knot_writer() to authenticated;

drop policy if exists "writers read own role" on public.knot_writer_roles;
create policy "writers read own role" on public.knot_writer_roles
for select to authenticated using (auth.uid() = user_id or public.is_knot_admin());
revoke all on public.knot_writer_roles from anon, authenticated;
grant select on public.knot_writer_roles to authenticated;

drop policy if exists "writers read own submissions" on public.knot_submissions;
create policy "writers read own submissions" on public.knot_submissions
for select to authenticated using (author_id = auth.uid() or public.is_knot_admin());
drop policy if exists "writers create own submissions" on public.knot_submissions;
create policy "writers create own submissions" on public.knot_submissions
for insert to authenticated with check (author_id = auth.uid() and public.is_knot_writer() and status in ('draft','submitted'));
drop policy if exists "writers edit own drafts" on public.knot_submissions;
create policy "writers edit own drafts" on public.knot_submissions
for update to authenticated using ((author_id = auth.uid() and public.is_knot_writer() and status in ('draft','submitted')) or public.is_knot_admin())
with check ((author_id = auth.uid() and public.is_knot_writer() and status in ('draft','submitted')) or public.is_knot_admin());
revoke all on public.knot_submissions from anon, authenticated;
grant select, insert, update on public.knot_submissions to authenticated;
