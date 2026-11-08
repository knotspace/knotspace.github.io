import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://knotspace.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 8192) {
    return json({ error: "リクエストが大きすぎます。" }, 413);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!supabaseUrl || !serviceKey || !anonKey || !turnstileSecret) {
    return json({ error: "認証サーバーの設定が完了していません。" }, 503);
  }

  try {
    const rawBody = await req.text();
    if (rawBody.length > 8192) return json({ error: "リクエストが大きすぎます。" }, 413);
    const payload = JSON.parse(rawBody);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json({ error: "リクエスト形式が正しくありません。" }, 400);
    }
    const { action, username, password, captchaToken } = payload;
    const cleanUsername = typeof username === "string" ? username.trim() : "";
    const usernameNorm = cleanUsername.toLowerCase();

    if (!/^[A-Za-z0-9_-]{3,20}$/.test(cleanUsername)) {
      return json({ error: "ユーザー名は半角英数字・_・-の3〜20文字で入力してください。" }, 400);
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      return json({ error: "パスワードは8〜72文字で入力してください。" }, 400);
    }
    if (typeof captchaToken !== "string" || !captchaToken) {
      return json({ error: "本人確認を完了してください。" }, 400);
    }

    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: turnstileSecret, response: captchaToken }),
    });
    const verification = await verify.json();
    if (!verification.success || verification.hostname !== "knotspace.github.io") {
      return json({ error: "本人確認に失敗しました。もう一度お試しください。" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const auth = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const internalEmail = `${usernameNorm}@accounts.knot.invalid`;

    if (action === "signup") {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: internalEmail,
        password,
        email_confirm: true,
        user_metadata: { username: cleanUsername },
      });
      if (createError || !created.user) {
        return json({ error: "そのユーザー名は使用できないか、登録に失敗しました。" }, 400);
      }

      const { error: mapError } = await admin.from("knot_usernames").insert({
        user_id: created.user.id,
        username: cleanUsername,
        username_norm: usernameNorm,
      });
      if (mapError) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: mapError.code === "23505" ? "このユーザー名は既に使われています。" : "登録に失敗しました。時間をおいて再度お試しください。" }, 400);
      }

      const { data: signedIn, error: signInError } = await auth.auth.signInWithPassword({
        email: internalEmail,
        password,
      });
      if (signInError || !signedIn.session) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: "登録後のログインに失敗しました。もう一度お試しください。" }, 500);
      }
      return json({ ...signedIn.session, user: signedIn.user });
    }

    if (action === "login") {
      const { data: mapping } = await admin
        .from("knot_usernames")
        .select("user_id")
        .eq("username_norm", usernameNorm)
        .maybeSingle();
      if (!mapping) return json({ error: "ユーザー名またはパスワードが違います。" }, 401);

      const { data: signedIn, error: signInError } = await auth.auth.signInWithPassword({
        email: internalEmail,
        password,
      });
      if (signInError || !signedIn.session) {
        return json({ error: "ユーザー名またはパスワードが違います。" }, 401);
      }
      return json({ ...signedIn.session, user: signedIn.user });
    }

    return json({ error: "不正な操作です。" }, 400);
  } catch {
    return json({ error: "通信に失敗しました。時間をおいて再度お試しください。" }, 500);
  }
});
