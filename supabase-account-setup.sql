-- KNOT アカウント機能
-- Supabase Dashboard > SQL Editor で一度だけ実行してください。
create table if not exists public.knot_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.knot_profiles enable row level security;
drop policy if exists "Users can read own KNOT profile" on public.knot_profiles;
create policy "Users can read own KNOT profile" on public.knot_profiles
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can insert own KNOT profile" on public.knot_profiles;
create policy "Users can insert own KNOT profile" on public.knot_profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update own KNOT profile" on public.knot_profiles;
create policy "Users can update own KNOT profile" on public.knot_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_knot_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.knot_profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_knot on auth.users;
create trigger on_auth_user_created_knot
  after insert on auth.users
  for each row execute procedure public.handle_new_knot_user();

grant select, insert, update on public.knot_profiles to authenticated;
