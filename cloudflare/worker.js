const ALLOWED_ORIGINS = new Set([
  "https://knotspace.github.io",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);

function corsHeaders(origin) {
  const headers = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return new Response(null, { status: 403, headers: corsHeaders("") });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      let database = "not_configured";
      if (env.DB) {
        try {
          await env.DB.prepare("SELECT 1 AS ok").first();
          database = "connected";
        } catch {
          database = "connection_error";
        }
      }
      return json({
        service: "KNOT CMS API",
        status: "ok",
        database,
        mode: "read-only-bootstrap",
      }, 200, origin);
    }

    return json({ error: "Not found" }, 404, origin);
  },
};
