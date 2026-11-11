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

const adminDir = resolve("public/admin");
const adminHtml = resolve(adminDir, "index.html");
const localeSource = resolve("scripts/tina-ja.js");
const pwaSource = resolve("public/admin-pwa");

try {
  await mkdir(adminDir, { recursive: true });
  await copyFile(localeSource, resolve(adminDir, "knot-ja.js"));
  for (const file of ["manifest.webmanifest", "icon.svg", "offline.html", "sw.js"]) {
    await copyFile(resolve(pwaSource, file), resolve(adminDir, file));
  }

  let html = await readFile(adminHtml, "utf8");
  if (!html.includes("knot-ja.js")) {
    html = html.replace("</body>", '  <script src="./knot-ja.js"></script>\n</body>');
  }
  if (!html.includes('rel="manifest"')) {
    html = html.replace("</head>", '  <link rel="manifest" href="./manifest.webmanifest">\n  <meta name="theme-color" content="#0b1220">\n</head>');
  }
  if (!html.includes("knot-admin-pwa")) {
    html = html.replace("</body>", '  <script id="knot-admin-pwa">if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" }).catch(() => {}));</script>\n</body>');
  }
  await writeFile(adminHtml, html, "utf8");
  console.log("[TinaCMS] 日本語UI補助とKNOT Admin PWAを適用しました。");
} catch (error) {
  console.warn("[TinaCMS] 管理画面の追加機能を適用できませんでした:", error.message);
}
