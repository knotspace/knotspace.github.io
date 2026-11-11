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
          { type: "datetime", name: "pubDate", label: "公開日時", description: "記事を公開する日付と時刻。日付を変更したら入力欄からフォーカスを外して反映してください。", required: true, ui: { dateFormat: "YYYY年MM月DD日", timeFormat: "HH:mm" } },
          { type: "datetime", name: "publishAt", label: "予約公開日時", description: "予約公開を使わない場合は空欄で構いません。", ui: { dateFormat: "YYYY年MM月DD日", timeFormat: "HH:mm" } },
          { type: "datetime", name: "updatedDate", label: "更新日", description: "記事を大きく更新した場合に設定します。", ui: { dateFormat: "YYYY年MM月DD日", timeFormat: "HH:mm" } },
          { type: "string", name: "category", label: "カテゴリー", description: "例：お知らせ、読書、勉強、テクノロジー", required: true },
          { type: "string", name: "contentType", label: "記事種別", description: "記事の内容に合う種別を入力します。通常の記事では空欄でも構いません。" },
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
