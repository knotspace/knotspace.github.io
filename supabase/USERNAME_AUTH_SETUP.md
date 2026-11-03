# KNOT ユーザー名認証の切り替え手順

この変更では、画面にメールアドレスを出さず、ユーザー名＋パスワードで登録・ログインします。Supabase Auth の内部識別子には `<username>@accounts.knot.invalid` を使います。実際のメール送信やメール確認は行いません。

## 1. Supabase SQL Editor

`supabase/migrations/202611030001_username_auth.sql` の内容を実行します。

## 2. Edge Function の環境変数

Supabase Dashboard の Edge Functions の Secrets に次を設定します。

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_SECRET_KEY`

Service Role Key と Turnstile Secret Key はブラウザー側やGitHubリポジトリに絶対に置かないでください。

## 3. Edge Function のデプロイ

Supabase CLI でリポジトリのルートから実行します。

```sh
supabase functions deploy username-auth --no-verify-jwt
```

この関数はユーザー名の照合とAuthユーザー作成をサーバー側で行います。ユーザー名の対応表はRLSでブラウザーから読めないようにしています。

## 4. 動作確認

本番切り替え前に、テスト用ユーザーで以下を確認します。

1. 新規登録してマイページへ移動する
2. ログアウトして、同じユーザー名・パスワードで再ログインする
3. 学習記録・お気に入りが保存できる
4. 投稿者権限の付与がユーザー名でできる

## 5. 既存アカウントのリセット

**新方式の登録・ログインが確認できてから**、Supabase SQL Editor で `supabase/reset-existing-accounts.sql` を実行します。この操作は既存Authユーザーを全削除します。ユーザーIDに紐づく学習記録・お気に入り・投稿者権限なども、外部キーの削除設定によっては一緒に削除されます。元に戻せないため、必要なデータがあれば先にバックアップしてください。

管理者アカウントも削除対象です。新方式で管理者として再登録した後、SQL Editor で次を実行して管理者権限を付け直します（ユーザー名は実際のものに置き換え）。

```sql
insert into public.knot_admins (user_id)
select user_id
from public.knot_usernames
where username_norm = lower('YOUR_USERNAME')
on conflict (user_id) do nothing;
```
