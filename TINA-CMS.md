# TinaCMS（ブログ編集）

KNOTのブログ編集はTinaCMSに一本化しました。管理画面は `/admin/` です。旧Decap CMSは廃止しています。

## ローカル開発

1. `npm install`
2. `npm run cms:dev`
3. `http://localhost:4321/admin/index.html#/collections/blog` を開きます。

ローカル編集では記事ファイルが `src/content/blog/` のMarkdownとして保存されます。保存後、Gitで変更を確認してコミット・プッシュしてください。

## GitHub Pagesでの公開

GitHub Pagesは静的ホスティングです。TinaCMSの編集内容はTinaCloudを経由してGitHubリポジトリへ保存し、GitHub ActionsでAstroを再ビルドします。

1. [TinaCloud](https://app.tina.io/) でプロジェクトを作成し、`knotspace/knotspace.github.io` の `main` ブランチを接続します。
2. TinaCloudのClient IDと、記事の読み書きができる権限を持つトークンを取得します。Read-only Tokenでは保存できません。
3. GitHubリポジトリの Settings → Secrets and variables → Actions に `TINA_CLIENT_ID` と `TINA_TOKEN` を登録します。
4. Editorial WorkflowはOFFにすると、設定に応じてmainブランチへ直接保存できます。

認証情報が未設定の場合はCMS画面の生成だけをスキップし、通常のサイトビルドは継続します。

## 互換性

- 管理画面はTinaCMSの `/admin/` に一本化しています。
- 既存記事のMarkdownと公開URLは維持します。
- 記事本文・メタデータは `src/content/blog/` を編集します。
