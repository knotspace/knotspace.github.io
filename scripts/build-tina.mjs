import { spawnSync } from "node:child_process";

const clientId = process.env.TINA_CLIENT_ID;
const token = process.env.TINA_TOKEN;

if (!clientId || !token) {
  console.log("[TinaCMS] TINA_CLIENT_ID / TINA_TOKEN が未設定のため、CMS管理画面の生成をスキップしました。");
  process.exit(0);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["tinacms", "build"], { stdio: "inherit", env: process.env });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
