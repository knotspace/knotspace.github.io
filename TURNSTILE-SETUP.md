# KNOT Turnstile CAPTCHA 設定

KNOTのログイン・新規登録フォームには Cloudflare Turnstile の表示とトークン送信処理を追加しています。認証を有効化するには、Cloudflare と Supabase の設定が必要です。

## 1. Cloudflare Turnstile のウィジェットを作成

1. https://dash.cloudflare.com/ にログイン（アカウントがなければ作成）。
2. 左メニューの Turnstile を開き、ウィジェットを追加。
3. ウィジェット名は `KNOT account` などにする。
4. ホスト名に `knotspace.github.io` を登録。
5. ウィジェットモードは Managed を推奨。
6. 作成後、Sitekey と Secret key を控える。

## 2. Sitekey をサイトに設定

`src/pages/account.astro` の `turnstileSiteKey` に Sitekey を設定する。

```js
const turnstileSiteKey = 'ここにSitekey';
```

Sitekey は公開情報なのでフロントエンドに置いてよい。**Secret key は絶対にソースコードやGitHubへ書かない。**

## 3. Supabase 側で CAPTCHA を有効化

1. Supabase Dashboard の KNOT プロジェクトを開く。
2. Authentication → Settings（または Project Settings → Authentication）へ進む。
3. Bot and Abuse Protection の CAPTCHA protection を有効にする。
4. Provider で Cloudflare Turnstile を選択。
5. Cloudflare の Secret key を入力して保存。

Supabase Auth が受け取った CAPTCHA トークンを Cloudflare 側で検証するため、フロントエンドだけの見せかけのチェックにはなりません。

## 4. 動作確認

- `https://knotspace.github.io/account/` を開く。
- Turnstile が表示されることを確認。
- 本人確認を完了してからログイン・新規登録できることを確認。
- 本人確認を完了せず送信すると、フォーム側で送信を止めることを確認。

## 注意

- 現在はログイン・新規登録フォームが対象。投稿フォームやその他の独自APIは別途対策が必要。
- Supabase の CAPTCHA 設定を有効化する前に、Sitekey と Secret key の両方を設定する。
- Secret key は Supabase Dashboard にだけ入力し、ChatGPTやGitHubのIssueなどに貼らない。
- Cloudflare Turnstile のトークンは短時間で失効し、使い回しできない。フォーム送信後はウィジェットをリセットする。
