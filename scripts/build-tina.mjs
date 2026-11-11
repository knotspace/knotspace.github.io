import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const clientId = process.env.TINA_CLIENT_ID;
const token = process.env.TINA_TOKEN;

if (!clientId || !token) {
  console.log("[TinaCMS] TINA_CLIENT_ID / TINA_TOKEN が未設定のため、CMS管理画面の生成をスキップしました。");
  process.exit(0);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["tinacms", "build"], { stdio: "inherit", env: process.env });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

// TinaCMS generates its admin app in public/admin. Add a small, isolated
// Japanese UI layer after each build so it survives clean CI deployments.
const adminDir = resolve("public/admin");
const adminHtml = resolve(adminDir, "index.html");
const localeSource = resolve("scripts/tina-ja.js");

try {
  await mkdir(adminDir, { recursive: true });
  await copyFile(localeSource, resolve(adminDir, "knot-ja.js"));
  let html = await readFile(adminHtml, "utf8");
  if (!html.includes("knot-ja.js")) {
    html = html.replace("</body>", '  <script src="./knot-ja.js"></script>\n</body>');
    await writeFile(adminHtml, html, "utf8");
  }
  console.log("[TinaCMS] 管理画面に日本語UI補助を適用しました。");
} catch (error) {
  console.warn("[TinaCMS] 日本語UI補助を適用できませんでした:", error.message);
}
