# KNOT 投稿者アカウント設定（CLI不要）

投稿者は通常のKNOTアカウントを自分で作成し、管理者がSQL Editorで投稿者権限を付与します。Supabase CLI、Edge Functionのデプロイ、追加サービスは不要です。

## 1. データベース設定（初回のみ）

1. Supabase Dashboardでプロジェクト `rtzorqaigpeechqywjie` を開く
2. **SQL Editor** → **New query**
3. リポジトリ直下の `supabase-writer-setup.sql` の内容を貼り付けて実行

## 2. 管理者アカウントの確認

管理者アカウントが `knot_admins` テーブルに登録されている必要があります。未登録の場合は、Supabase Dashboard → Authentication → Users で自分のユーザーUUIDを確認し、SQL Editorで実行します。

```sql
insert into public.knot_admins (user_id)
values ('自分のユーザーUUID')
on conflict (user_id) do nothing;
```

## 3. 投稿者を追加

1. 投稿者に `https://knotspace.github.io/account/` から通常のアカウント登録をしてもらう（メール確認が有効なら確認も完了してもらう）
2. 管理者がKNOTにログインし、マイページの「投稿者を招待」に登録メールアドレスを入力
3. 「権限付与SQLを作成」→「SQLをコピー」
4. Supabase DashboardのSQL Editorに貼り付けて実行
5. 投稿者はログアウト・再ログインし、マイページの「記事を書く」から利用

## 権限

- 投稿者：自分の記事の下書き作成・編集・確認依頼
- 投稿者にできないこと：公開、削除、他人の記事の閲覧、管理者招待、設定変更
- 管理者：全投稿の確認、Markdownコピー、CMSへの登録・公開

権限はSupabaseのRow Level Security（RLS）で制限します。ブラウザに管理者キーやGitHubトークンは置きません。

## 無料利用

Supabase Auth / Databaseの無料枠で動かす構成です。メール送信やデータベースの利用量などはSupabaseの無料枠・利用条件に従います。
