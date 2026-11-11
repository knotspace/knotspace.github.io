import { defineConfig } from "tinacms";

const branch = process.env.GITHUB_REF_NAME || process.env.HEAD || "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    publicFolder: "public",
    outputFolder: "admin",
  },
  media: {
    tina: {
      publicFolder: "public",
      mediaRoot: "uploads",
    },
  },
  schema: {
    collections: [
      {
        name: "blog",
        label: "ブログ記事",
        path: "src/content/blog",
        format: "md",
        fields: [
          { type: "string", name: "title", label: "タイトル", isTitle: true, required: true },
          { type: "string", name: "description", label: "記事の説明", ui: { component: "textarea" }, required: true },
          { type: "datetime", name: "pubDate", label: "公開日時", required: true },
          { type: "datetime", name: "publishAt", label: "予約公開日時" },
          { type: "datetime", name: "updatedDate", label: "更新日" },
          { type: "string", name: "category", label: "カテゴリー", required: true },
          { type: "string", name: "contentType", label: "記事種別" },
          { type: "boolean", name: "aiGenerated", label: "AI生成記事" },
          { type: "number", name: "popularity", label: "人気度" },
          { type: "image", name: "heroImage", label: "アイキャッチ画像" },
          { type: "rich-text", name: "body", label: "本文", isBody: true },
        ],
      },
    ],
  },
  telemetry: "disabled",
});
