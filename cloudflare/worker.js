const ALLOWED_ORIGIN = "https://knotspace.github.io";
const MODEL = "gemini-3.8-flash";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-KNOT-ADMIN-TOKEN",
      "Vary": "Origin",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) return new Response(null, { status: 403 });
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-KNOT-ADMIN-TOKEN",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (origin !== ALLOWED_ORIGIN) return json({ error: "許可されていないアクセスです。" }, 403);
    if (request.method !== "POST") return json({ error: "POST only" }, 405);
    if (!env.GEMINI_API_KEY || !env.KNOT_ADMIN_TOKEN) {
      return json({ error: "WorkerのSecretsが未設定です。GEMINI_API_KEYとKNOT_ADMIN_TOKENを登録してください。" }, 503);
    }
    if (request.headers.get("X-KNOT-ADMIN-TOKEN") !== env.KNOT_ADMIN_TOKEN) {
      return json({ error: "管理用トークンが違います。" }, 401);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "リクエスト形式が正しくありません。" }, 400); }
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return json({ error: "指示文を入力してください。" }, 400);
    if (prompt.length > 16000) return json({ error: "入力が長すぎます（16,000文字以内）。" }, 413);

    try {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: "あなたは日本語メディアKNOTの編集アシスタントです。中学生にも読みやすい、自然で正確な日本語で回答してください。事実を捏造せず、不明点は不明と明記してください。記事本文を求められた場合はMarkdownで出力してください。"
              }]
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
          }),
        }
      );
      const data = await upstream.json();
      if (!upstream.ok) {
        const message = data?.error?.message || "Gemini APIでエラーが発生しました。";
        const status = upstream.status === 429 ? 429 : 502;
        return json({ error: message, quota: upstream.status === 429 }, status);
      }
      const text = (data.candidates || [])
        .flatMap(candidate => candidate.content?.parts || [])
        .map(part => part.text || "")
        .join("")
        .trim();
      if (!text) return json({ error: "AIから文章を取得できませんでした。" }, 502);
      return json({ text, model: MODEL });
    } catch {
      return json({ error: "Geminiへの接続に失敗しました。時間をおいて再試行してください。" }, 502);
    }
  },
};
