-- KNOT 管理人権限の設定
-- Supabase Dashboard > SQL Editor で一度だけ実行してください。

create table if not exists public.knot_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.knot_admins enable row level security;

drop policy if exists "Admins can read their own admin record" on public.knot_admins;
create policy "Admins can read their own admin record"
  on public.knot_admins
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.knot_admins from anon, authenticated;
grant select on table public.knot_admins to authenticated;

-- 管理人として登録するアカウント
insert into public.knot_admins (user_id)
select id
from auth.users
where lower(email) = lower('ryo51057@gmail.com')
on conflict (user_id) do nothing;
