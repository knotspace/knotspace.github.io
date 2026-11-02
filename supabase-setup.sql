-- KNOT: Supabase いいね・閲覧数
-- Supabase SQL Editorで全体を実行してください。
-- article_stats と article_likes テーブルが既に作成済みである前提です。

create or replace function public.increment_article_view(article_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_views bigint;
begin
  if article_slug is null or length(article_slug) < 1 or length(article_slug) > 200 then
    raise exception 'Invalid article slug';
  end if;

  insert into public.article_stats (slug, views)
  values (article_slug, 1)
  on conflict (slug)
  do update set views = public.article_stats.views + 1
  returning views into current_views;

  return current_views;
end;
$$;

create or replace function public.like_article(article_slug text, visitor_id text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
  current_likes bigint;
begin
  if article_slug is null or length(article_slug) < 1 or length(article_slug) > 200
     or visitor_id is null or length(visitor_id) < 1 or length(visitor_id) > 100 then
    raise exception 'Invalid input';
  end if;

  insert into public.article_likes (slug, visitor_id)
  values (article_slug, visitor_id)
  on conflict (slug, visitor_id) do nothing;

  get diagnostics inserted_count = row_count;

  insert into public.article_stats (slug, likes)
  values (article_slug, inserted_count)
  on conflict (slug)
  do update set likes = public.article_stats.likes + inserted_count
  returning likes into current_likes;

  return current_likes;
end;
$$;

revoke all on function public.increment_article_view(text) from public;
revoke all on function public.like_article(text, text) from public;
grant execute on function public.increment_article_view(text) to anon, authenticated;
grant execute on function public.like_article(text, text) to anon, authenticated;

-- テーブルの読み取りだけを公開。書き込みは上記RPC関数経由に限定。
alter table public.article_stats enable row level security;
drop policy if exists "stats are readable by everyone" on public.article_stats;
create policy "stats are readable by everyone"
on public.article_stats for select
to anon, authenticated
using (true);

alter table public.article_likes enable row level security;
