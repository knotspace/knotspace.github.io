import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://knotspace.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "ログインが必要です。" }, { status: 401, headers: cors });

  const adminClient = createClient(url, service, { auth: { persistSession: false } });
  const userClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser(token);
  if (userError || !user) return Response.json({ error: "ログイン状態を確認できません。" }, { status: 401, headers: cors });

  const { data: admin } = await adminClient.from("knot_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return Response.json({ error: "管理者のみ実行できます。" }, { status: 403, headers: cors });

  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return Response.json({ error: "正しいメールアドレスを入力してください。" }, { status: 400, headers: cors });
    }
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: "https://knotspace.github.io/account/",
      data: { display_name: email.split("@")[0], knot_role: "writer" },
    });
    if (error) throw error;
    const { error: roleError } = await adminClient.from("knot_writer_roles").upsert({ user_id: data.user.id });
    if (roleError) throw roleError;
    return Response.json({ ok: true, message: "招待メールを送信しました。" }, { headers: cors });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "招待に失敗しました。" }, { status: 400, headers: cors });
  }
});
