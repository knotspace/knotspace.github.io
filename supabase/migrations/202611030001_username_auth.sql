-- KNOT username-only authentication
-- Run this migration before deploying the username-auth Edge Function.
create table if not exists public.knot_usernames (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  username_norm text not null unique,
  created_at timestamptz not null default now(),
  constraint knot_usernames_username_length check (char_length(username) between 3 and 20),
  constraint knot_usernames_username_format check (username ~ '^[A-Za-z0-9_-]+$')
);

alter table public.knot_usernames enable row level security;

-- Username mappings must never be readable or writable directly from the browser.
revoke all on table public.knot_usernames from anon, authenticated;
