const ALLOWED_ORIGINS = new Set([
  "https://knotspace.github.io",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);
const ADMIN_GITHUB_LOGIN = "knotspace";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function corsHeaders(origin) {
  const headers = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(data, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

function cookieValue(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const part of cookies.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return atob(padded);
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return base64url(data);
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

async function createSession(login, secret) {
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    login,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })));
  const signature = base64url(await hmac(payload, secret));
  return payload + "." + signature;
}

async function readSession(request, secret) {
  const token = cookieValue(request, "__Host-knot_session");
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const expected = await hmac(parts[0], secret);
    const actual = Uint8Array.from(decodeBase64url(parts[1]), c => c.charCodeAt(0));
    if (expected.length !== actual.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
    if (diff !== 0) return null;
    const payload = JSON.parse(decodeBase64url(parts[0]));
    if (payload.login !== ADMIN_GITHUB_LOGIN || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    return { login: payload.login, expiresAt: payload.exp };
  } catch {
    return null;
  }
}

function clearCookie(name, sameSite = "None") {
  return name + "=; Path=/; HttpOnly; Secure; SameSite=" + sameSite + "; Max-Age=0";
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
        mode: "github-oauth-auth-bootstrap",
      }, 200, origin);
    }

    if (url.pathname === "/auth/login" && request.method === "GET") {
      if (!env.GITHUB_CLIENT_ID) return json({ error: "OAuth is not configured" }, 503, origin);
      const state = randomToken();
      const callback = url.origin + "/auth/callback";
      const authorize = new URL("https://github.com/login/oauth/authorize");
      authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authorize.searchParams.set("redirect_uri", callback);
      authorize.searchParams.set("scope", "read:user");
      authorize.searchParams.set("state", state);
      return new Response(null, {
        status: 302,
        headers: {
          "Location": authorize.toString(),
          "Cache-Control": "no-store",
          "Set-Cookie": "__Host-knot_oauth_state=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600",
        },
      });
    }

    if (url.pathname === "/auth/callback" && request.method === "GET") {
      const state = url.searchParams.get("state");
      const savedState = cookieValue(request, "__Host-knot_oauth_state");
      const code = url.searchParams.get("code");
      const clearState = clearCookie("__Host-knot_oauth_state", "Lax");
      if (!state || !savedState || state !== savedState || !code) {
        return json({ error: "OAuth state validation failed" }, 400, origin, { "Set-Cookie": clearState });
      }
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SESSION_SECRET) {
        return json({ error: "OAuth server secrets are not configured" }, 503, origin, { "Set-Cookie": clearState });
      }

      try {
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "KNOT-CMS",
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: url.origin + "/auth/callback",
          }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
          return json({ error: "GitHub token exchange failed" }, 502, origin, { "Set-Cookie": clearState });
        }

        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            "Authorization": "Bearer " + tokenData.access_token,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "KNOT-CMS",
          },
        });
        const user = await userResponse.json();
        if (!userResponse.ok || user.login !== ADMIN_GITHUB_LOGIN) {
          return new Response("このGitHubアカウントにはKNOT CMSの管理権限がありません。", {
            status: 403,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "Set-Cookie": clearState,
            },
          });
        }

        const session = await createSession(user.login, env.SESSION_SECRET);
        return new Response(null, {
          status: 302,
          headers: {
            "Location": "https://knotspace.github.io/admin/?knot_login=success",
            "Cache-Control": "no-store",
            "Set-Cookie": [
              clearState,
              "__Host-knot_session=" + session + "; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=" + SESSION_TTL_SECONDS,
            ].join(", "),
          },
        });
      } catch {
        return json({ error: "OAuth authentication failed" }, 502, origin, { "Set-Cookie": clearState });
      }
    }

    if (url.pathname === "/api/me" && request.method === "GET") {
      const session = await readSession(request, env.SESSION_SECRET);
      if (!session) return json({ authenticated: false }, 401, origin);
      return json({ authenticated: true, login: session.login, expiresAt: session.expiresAt }, 200, origin);
    }

    if (url.pathname === "/auth/logout" && request.method === "POST") {
      return json({ authenticated: false }, 200, origin, {
        "Set-Cookie": clearCookie("__Host-knot_session"),
      });
    }

    return json({ error: "Not found" }, 404, origin);
  },
};
