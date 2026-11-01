# たかブロ

Astro 4 と GitHub Pages で動かす個人ブログです。

## ローカルで起動

```bash
npm install
npm run dev
```

## GitHub Pages で公開する

GitHub Pages のURLが `https://ユーザー名.github.io/リポジトリ名/` の形式なら、`astro.config.mjs` の `site` と `base` を設定してください。

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ユーザー名.github.io',
  base: '/リポジトリ名',
});
```

リポジトリ名が `ユーザー名.github.io` の場合は `base: '/'` にします。GitHubリポジトリの Settings → Pages で Source を GitHub Actions にしてください。

## 記事を追加する

`src/content/blog/` に `.md` ファイルを追加します。

```yaml
---
title: "記事タイトル"
description: "記事の説明文"
pubDate: "2026-11-02"
category: "日常"
heroImage: "https://example.com/image.jpg"
---

本文をMarkdownで書きます。
```

`category` と `heroImage` は省略できます。画像URLはHTTPSの公開URLを指定してください。
