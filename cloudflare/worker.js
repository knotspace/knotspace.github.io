const ALLOWED_ORIGINS = new Set([
  "https://knotspace.github.io",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);
const ADMIN_GITHUB_LOGIN = "knotspace";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_DOCUMENT_BYTES = 200 * 1024;

function corsHeaders(origin) {
  const headers = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-KNOT-CSRF",
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
    ["sign"],
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

function validSlug(value) {
  return typeof value === "string" && value.length >= 2 && value.length <= 100 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function validTitle(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 200;
}

function validStatus(value) {
  return value === "draft" || value === "review";
}

function documentSnapshot(row) {
  return {
    document_id: row.document_id,
    collection: row.collection,
    slug: row.slug,
    title: row.title,
    content_json: row.content_json,
    status: row.status,
    scheduled_at: row.scheduled_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
  };
}

async function readJsonBody(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { error: "Content-Type must be application/json" };
  }
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_DOCUMENT_BYTES) return { error: "Document is too large" };
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_DOCUMENT_BYTES) return { error: "Document is too large" };
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "JSON body must be an object" };
    return { value };
  } catch {
    return { error: "Invalid JSON" };
  }
}

async function requireAdmin(request, env) {
  const session = await readSession(request, env.SESSION_SECRET);
  if (!session) return { response: json({ error: "Authentication required" }, 401, request.headers.get("Origin") || "") };
  return { session };
}

async function requireCsrf(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "Origin is not allowed" }, 403, origin);
  }
  const sessionCookie = cookieValue(request, "__Host-knot_session");
  const supplied = request.headers.get("X-KNOT-CSRF") || "";
  if (!sessionCookie || !env.SESSION_SECRET || !supplied) {
    return json({ error: "CSRF validation failed" }, 403, origin);
  }
  const expected = base64url(await hmac("csrf:" + sessionCookie, env.SESSION_SECRET));
  if (supplied !== expected) return json({ error: "CSRF validation failed" }, 403, origin);
  return null;
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
        mode: "authenticated-document-api",
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
        const redirectHeaders = new Headers({
          "Location": "https://knotspace.github.io/admin/?knot_login=success",
          "Cache-Control": "no-store",
        });
        redirectHeaders.append("Set-Cookie", clearState);
        redirectHeaders.append(
          "Set-Cookie",
          "__Host-knot_session=" + session + "; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=" + SESSION_TTL_SECONDS,
        );
        return new Response(null, { status: 302, headers: redirectHeaders });
      } catch {
        return json({ error: "OAuth authentication failed" }, 502, origin, { "Set-Cookie": clearState });
      }
    }

    if (url.pathname === "/api/me" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const sessionCookie = cookieValue(request, "__Host-knot_session");
      const csrfToken = base64url(await hmac("csrf:" + sessionCookie, env.SESSION_SECRET));
      return json({
        authenticated: true,
        login: auth.session.login,
        expiresAt: auth.session.expiresAt,
        csrfToken,
      }, 200, origin);
    }

    if (url.pathname === "/auth/logout" && request.method === "POST") {
      const csrfError = await requireCsrf(request, env);
      if (csrfError) return csrfError;
      return json({ authenticated: false }, 200, origin, {
        "Set-Cookie": clearCookie("__Host-knot_session"),
      });
    }

    if (url.pathname === "/api/documents" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const collection = url.searchParams.get("collection");
      const status = url.searchParams.get("status");
      if (collection && collection !== "blog" && collection !== "pages") {
        return json({ error: "Invalid collection" }, 400, origin);
      }
      if (status && !["draft", "review", "published", "scheduled"].includes(status)) {
        return json({ error: "Invalid status" }, 400, origin);
      }
      const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
      let query = "SELECT document_id, collection, slug, title, status, scheduled_at, created_at, updated_at, published_at FROM cms_documents";
      const clauses = [];
      const values = [];
      if (collection) { clauses.push("collection = ?"); values.push(collection); }
      if (status) { clauses.push("status = ?"); values.push(status); }
      if (clauses.length) query += " WHERE " + clauses.join(" AND ");
      query += " ORDER BY updated_at DESC LIMIT ?";
      values.push(limit);
      try {
        const result = await env.DB.prepare(query).bind(...values).all();
        return json({ documents: result.results || [] }, 200, origin);
      } catch {
        return json({ error: "Could not load documents" }, 500, origin);
      }
    }

    if (url.pathname === "/api/documents" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const csrfError = await requireCsrf(request, env);
      if (csrfError) return csrfError;
      const parsed = await readJsonBody(request);
      if (parsed.error) return json({ error: parsed.error }, 400, origin);
      const body = parsed.value;
      const collection = body.collection;
      const slug = body.slug;
      const title = body.title;
      const status = body.status || "draft";
      if (collection !== "blog" && collection !== "pages") return json({ error: "collection must be blog or pages" }, 400, origin);
      if (!validSlug(slug)) return json({ error: "slug must use lowercase letters, numbers, and hyphens" }, 400, origin);
      if (!validTitle(title)) return json({ error: "title is required and must be at most 200 characters" }, 400, origin);
      if (!validStatus(status)) return json({ error: "Only draft and review can be created through this API" }, 400, origin);
      if (body.content === undefined) return json({ error: "content is required" }, 400, origin);
      let contentJson;
      try { contentJson = JSON.stringify(body.content); } catch { return json({ error: "content is not valid JSON" }, 400, origin); }
      if (new TextEncoder().encode(contentJson).length > MAX_DOCUMENT_BYTES) return json({ error: "Document is too large" }, 413, origin);

      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const row = {
        document_id: id, collection, slug, title: title.trim(), content_json: contentJson,
        status, scheduled_at: null, created_at: now, updated_at: now, published_at: null,
      };
      try {
        await env.DB.batch([
          env.DB.prepare("INSERT INTO cms_documents (document_id, collection, slug, title, content_json, status, scheduled_at, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)")
            .bind(id, collection, slug, row.title, contentJson, status, now, now),
          env.DB.prepare("INSERT INTO cms_revisions (revision_id, document_id, snapshot_json, author_label) VALUES (?, ?, ?, ?)")
            .bind(crypto.randomUUID(), id, JSON.stringify(row), auth.session.login),
        ]);
        return json({ document: row }, 201, origin);
      } catch (error) {
        const message = String(error && error.message || "");
        if (message.includes("UNIQUE")) return json({ error: "That slug already exists in this collection" }, 409, origin);
        return json({ error: "Could not create document" }, 500, origin);
      }
    }

    const documentMatch = url.pathname.match(/^\/api\/documents\/([a-f0-9-]{36})$/i);
    if (documentMatch && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      try {
        const row = await env.DB.prepare("SELECT * FROM cms_documents WHERE document_id = ?").bind(documentMatch[1]).first();
        if (!row) return json({ error: "Document not found" }, 404, origin);
        let content;
        try { content = JSON.parse(row.content_json); } catch { content = row.content_json; }
        return json({ document: { ...row, content, content_json: undefined } }, 200, origin);
      } catch {
        return json({ error: "Could not load document" }, 500, origin);
      }
    }

    if (documentMatch && request.method === "PUT") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const csrfError = await requireCsrf(request, env);
      if (csrfError) return csrfError;
      const parsed = await readJsonBody(request);
      if (parsed.error) return json({ error: parsed.error }, 400, origin);
      const body = parsed.value;
      try {
        const existing = await env.DB.prepare("SELECT * FROM cms_documents WHERE document_id = ?").bind(documentMatch[1]).first();
        if (!existing) return json({ error: "Document not found" }, 404, origin);
        const slug = body.slug === undefined ? existing.slug : body.slug;
        const title = body.title === undefined ? existing.title : body.title;
        const status = body.status === undefined ? existing.status : body.status;
        const collection = body.collection === undefined ? existing.collection : body.collection;
        if (collection !== existing.collection) return json({ error: "Moving documents between collections is not supported yet" }, 400, origin);
        if (!validSlug(slug)) return json({ error: "Invalid slug" }, 400, origin);
        if (!validTitle(title)) return json({ error: "Invalid title" }, 400, origin);
        if (!validStatus(status)) return json({ error: "Only draft and review can be saved through this API" }, 400, origin);
        let contentJson = existing.content_json;
        if (body.content !== undefined) {
          contentJson = JSON.stringify(body.content);
          if (new TextEncoder().encode(contentJson).length > MAX_DOCUMENT_BYTES) return json({ error: "Document is too large" }, 413, origin);
        }
        const now = new Date().toISOString();
        const nextRow = {
          ...existing, slug, title: title.trim(), content_json: contentJson,
          status, updated_at: now,
        };
        await env.DB.batch([
          env.DB.prepare("INSERT INTO cms_revisions (revision_id, document_id, snapshot_json, author_label) VALUES (?, ?, ?, ?)")
            .bind(crypto.randomUUID(), existing.document_id, JSON.stringify(documentSnapshot(existing)), auth.session.login),
          env.DB.prepare("UPDATE cms_documents SET slug = ?, title = ?, content_json = ?, status = ?, updated_at = ? WHERE document_id = ?")
            .bind(nextRow.slug, nextRow.title, nextRow.content_json, nextRow.status, now, existing.document_id),
        ]);
        let content;
        try { content = JSON.parse(nextRow.content_json); } catch { content = nextRow.content_json; }
        return json({ document: { ...nextRow, content, content_json: undefined } }, 200, origin);
      } catch (error) {
        const message = String(error && error.message || "");
        if (message.includes("UNIQUE")) return json({ error: "That slug already exists in this collection" }, 409, origin);
        return json({ error: "Could not update document" }, 500, origin);
      }
    }

    const revisionsMatch = url.pathname.match(/^\/api\/documents\/([a-f0-9-]{36})\/revisions$/i);
    if (revisionsMatch && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      try {
        const result = await env.DB.prepare("SELECT revision_id, document_id, created_at, author_label FROM cms_revisions WHERE document_id = ? ORDER BY created_at DESC LIMIT 50")
          .bind(revisionsMatch[1]).all();
        return json({ revisions: result.results || [] }, 200, origin);
      } catch {
        return json({ error: "Could not load revisions" }, 500, origin);
      }
    }

    return json({ error: "Not found" }, 404, origin);
  },
};
