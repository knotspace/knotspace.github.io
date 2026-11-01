# たかブロ

Astro 4 と GitHub Pages で運用する個人ブログです。

## ローカルで起動

```bash
npm install
npm run dev
```

## GitHub Pages

この設定はリポジトリ `Shiratakihot/Astro` 用です。
公開URLは `https://shiratakihot.github.io/Astro/` を想定しています。

1. GitHub リポジトリの Settings → Pages を開く
2. Build and deployment の Source を **GitHub Actions** にする
3. `main` ブランチへ push すると `.github/workflows/deploy.yml` がビルド・公開します
4. リポジトリの Actions タブで Deploy Astro site to Pages が成功したことを確認します

## 記事を追加する

`src/content/blog/` に Markdown ファイル（`.md`）を追加します。

```md
---
title: "記事タイトル"
description: "記事の説明文"
pubDate: "2026-11-02"
category: "日常"
heroImage: "https://example.com/image.jpg"
---

## 見出し

ここに本文を書きます。
```

`category` と `heroImage` は省略できます。画像を使う場合は HTTPS の公開URLを指定してください。
