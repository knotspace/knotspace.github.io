# TinaCMS（ブログ編集）

既存のDecap CMS（`/admin/`）を残し、TinaCMSを別URL（`/tina-admin/`）で共存させます。

## ローカル開発

1. `npm install`
2. `npm run cms:dev`
3. `http://localhost:4321/tina-admin/index.html#/collections/blog` を開きます。

ローカル編集では記事ファイルが `src/content/blog/` のMarkdownとして保存されます。

## GitHub Pagesでの公開

GitHub Pagesは静的ホスティングです。TinaCMSのAstro向けリアルタイム・ビジュアル編集エンドポイントはGitHub Pagesでは実行できないため、この構成ではTinaCloud経由でMarkdownをGitHubへ保存し、GitHub ActionsでAstroを再ビルドします。

1. [TinaCloud](https://app.tina.io/) でプロジェクトを作成し、`knotspace/knotspace.github.io` の `main` ブランチを接続します。
2. TinaCloudのClient IDとRead-only Tokenを取得します。
3. GitHubリポジトリの Settings → Secrets and variables → Actions に `TINA_CLIENT_ID` と `TINA_TOKEN` を登録します。
4. `main` に反映すると、ビルド時に `/tina-admin/` が生成されます。

認証情報が未設定の場合はCMS画面の生成だけをスキップし、通常のサイトビルドは継続します。

## 互換性

- 既存の `/admin/`（Decap CMS）は削除しません。
- 既存記事のMarkdownと公開URLは維持します。
- TinaCMSでは記事メタデータとMarkdown本文を編集します。既存のブロック本文を使う記事は、従来のDecap CMSで編集できます。
- TinaCloudプロジェクトの接続とGitHub Secretsの登録は、リポジトリ所有者による操作が必要です。
