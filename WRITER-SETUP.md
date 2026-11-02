# KNOT 投稿者アカウントの有効化

投稿者権限はSupabase側で検証します。ブラウザに管理者キーやGitHubトークンを置かない設計です。

## 1. データベース設定（必須・一度だけ）

1. Supabase Dashboardでプロジェクト `rtzorqaigpeechqywjie` を開く
2. **SQL Editor** → **New query**
3. リポジトリ直下の `supabase-writer-setup.sql` の内容を貼り付けて実行

## 2. 招待機能のデプロイ（必須・一度だけ）

Supabase CLIを使い、リポジトリのルートで実行します。

```bash
supabase login
supabase link --project-ref rtzorqaigpeechqywjie
supabase functions deploy invite-writer
```

Edge FunctionはSupabaseの `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` をサーバー環境変数から読みます。通常はSupabaseが自動で設定するため、キーをGitHubやこのリポジトリに登録しないでください。

## 3. 管理者アカウントの確認

既存の管理者アカウントが `knot_admins` テーブルに登録されている必要があります。未登録の場合は、Supabase Dashboard → Authentication → Users で自分のユーザーUUIDを確認し、SQL Editorで実行します。

```sql
insert into public.knot_admins (user_id)
values ('自分のユーザーUUID')
on conflict (user_id) do nothing;
```

## 4. 使い方

- 管理者：KNOTにログイン → マイページ →「投稿者を招待」でメールアドレスを入力
- 招待された人：メールのリンクからアカウントを有効化 → マイページ →「記事を書く」
- 投稿者：記事を下書き保存、または「確認を依頼」
- 管理者：マイページ下部の投稿一覧で本文を確認し、MarkdownをコピーしてCMSへ登録

投稿者には公開・削除・管理者招待の権限を付与しません。記事データはRLSで本人のものに限定し、管理者のみ全件を確認できます。

## 無料利用について

この機能はSupabase Auth / Database / Edge Functionsの無料枠内で動かす想定です。利用量やSupabaseのプラン条件はアカウント側の最新条件に従います。メール送信数などが無料枠を超えた場合は制限される可能性があります。

**注意:** SQLの実行とEdge Functionの初回デプロイは、プロジェクト所有者のSupabaseアカウントで一度だけ行う必要があります。こちらからSupabaseの管理画面にログインしたり、秘密鍵を設定したりはできないため、コードを置いただけでは招待機能はまだ有効になりません。
