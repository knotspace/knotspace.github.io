-- KNOT Study 絵馬掲示板 / Supabase SQL
-- Supabase SQL Editorで実行。投稿・返信はpendingで保存し、管理者が確認してから公開する。
create extension if not exists pgcrypto;
create table if not exists public.ema_posts (
 id uuid primary key default gen_random_uuid(),
 category text not null check(category in ('高校受験','高専受験','大学受験','資格・検定','勉強報告','質問・相談','その他')),
 title text not null check(char_length(title) between 1 and 48),
 body text not null check(char_length(body) between 1 and 240),
 visitor_id text not null check(char_length(visitor_id) between 20 and 80),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.ema_likes (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.ema_posts(id) on delete cascade,
 visitor_id text not null check(char_length(visitor_id) between 20 and 80),
 created_at timestamptz not null default now(),
 unique(post_id,visitor_id)
);
create table if not exists public.ema_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.ema_posts(id) on delete cascade,
 visitor_id text not null check(char_length(visitor_id) between 20 and 80),
 body text not null check(char_length(body) between 1 and 160),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.ema_reports (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.ema_posts(id) on delete cascade,
 visitor_id text not null check(char_length(visitor_id) between 20 and 80),
 reason text not null check(char_length(reason) between 1 and 120),
 created_at timestamptz not null default now()
);
create index if not exists ema_posts_public_order on public.ema_posts(status,created_at desc);
create index if not exists ema_comments_public_order on public.ema_comments(post_id,status,created_at);
create index if not exists ema_likes_post on public.ema_likes(post_id);
alter table public.ema_posts enable row level security;
alter table public.ema_likes enable row level security;
alter table public.ema_comments enable row level security;
alter table public.ema_reports enable row level security;
drop policy if exists "read approved ema posts" on public.ema_posts;
create policy "read approved ema posts" on public.ema_posts for select to anon using(status='approved');
drop policy if exists "submit ema posts for review" on public.ema_posts;
create policy "submit ema posts for review" on public.ema_posts for insert to anon with check(status='pending');
drop policy if exists "read ema likes" on public.ema_likes;
create policy "read ema likes" on public.ema_likes for select to anon using(true);
drop policy if exists "add ema likes" on public.ema_likes;
create policy "add ema likes" on public.ema_likes for insert to anon with check(true);
drop policy if exists "remove ema likes" on public.ema_likes;
create policy "remove ema likes" on public.ema_likes for delete to anon using(true);
drop policy if exists "read approved ema comments" on public.ema_comments;
create policy "read approved ema comments" on public.ema_comments for select to anon using(status='approved');
drop policy if exists "submit ema comments for review" on public.ema_comments;
create policy "submit ema comments for review" on public.ema_comments for insert to anon with check(status='pending');
drop policy if exists "submit ema reports" on public.ema_reports;
create policy "submit ema reports" on public.ema_reports for insert to anon with check(true);
grant select,insert on public.ema_posts to anon;
grant select,insert,delete on public.ema_likes to anon;
grant select,insert on public.ema_comments to anon;
grant insert on public.ema_reports to anon;
-- 管理者はSupabase Table Editorで投稿・返信のstatusをpendingからapproved/rejectedへ変更する。
-- service_roleキーは絶対にブラウザへ公開しない。