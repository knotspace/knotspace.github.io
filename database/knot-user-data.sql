-- KNOT account data: private per-user learning records and favorites.
create table if not exists public.knot_learning_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  studied_on date not null default current_date,
  subject text not null check (char_length(subject) between 1 and 30),
  minutes integer not null check (minutes between 1 and 1440),
  correct integer not null default 0 check (correct between 0 and 10000),
  total integer not null default 0 check (total between 0 and 10000 and correct <= total),
  created_at timestamptz not null default now()
);
create index if not exists knot_learning_logs_user_date_idx on public.knot_learning_logs(user_id, studied_on desc);
alter table public.knot_learning_logs enable row level security;
drop policy if exists "Users manage own learning logs" on public.knot_learning_logs;
create policy "Users manage own learning logs" on public.knot_learning_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.knot_learning_logs to authenticated;

create table if not exists public.knot_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('article','quote','other')),
  title text not null check (char_length(title) between 1 and 120),
  url text not null default '' check (char_length(url) <= 500),
  created_at timestamptz not null default now(),
  unique (user_id, kind, title, url)
);
create index if not exists knot_favorites_user_created_idx on public.knot_favorites(user_id, created_at desc);
alter table public.knot_favorites enable row level security;
drop policy if exists "Users manage own favorites" on public.knot_favorites;
create policy "Users manage own favorites" on public.knot_favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.knot_favorites to authenticated;
