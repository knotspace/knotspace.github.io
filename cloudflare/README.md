# KNOT Cloudflare CMS backend (experimental)

This directory contains the experimental Cloudflare Workers + D1 backend for KNOT. The existing Decap CMS and GitHub Pages publishing flow remain unchanged.

## Current backend

- `worker.js`: GitHub OAuth, signed admin sessions, CSRF-protected document API, and revision history.
- `migrations/0001_initial.sql`: document and revision tables in D1.
- `wrangler.toml`: Worker and D1 binding, plus the public GitHub OAuth Client ID.
- Only the GitHub account `knotspace` is accepted as administrator.
- Publishing to the live Astro site is intentionally not implemented yet.

## Configure OAuth

GitHub OAuth App:

- Homepage URL: `https://knotspace.github.io`
- Authorization callback URL: `https://knot-cms-api.edanohumio.workers.dev/auth/callback`

The Client ID is public and stored in `wrangler.toml`. Never commit the Client Secret or session signing key.

From this directory:

```sh
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

Generate a session signing key locally with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Paste the generated key only into the hidden Wrangler prompt. Do not paste secrets into chat or commit them.

## Authentication endpoints

- `GET /auth/login`: starts GitHub OAuth.
- `GET /auth/callback`: validates OAuth state, exchanges the code server-side, checks the GitHub login, and issues an HttpOnly session cookie.
- `GET /api/me`: returns the administrator session and a session-bound CSRF token.
- `POST /auth/logout`: clears the session cookie; requires the CSRF header.
- `GET /api/health`: reports Worker and D1 connectivity.

The session uses HMAC-SHA-256, expires after 8 hours, and is restricted to the `knotspace` GitHub login. The GitHub access token is not stored.

## Document API

All document endpoints require an authenticated administrator session.

- `GET /api/documents?collection=blog&status=draft&limit=50`: list documents.
- `POST /api/documents`: create a document.
- `GET /api/documents/:id`: read a document.
- `PUT /api/documents/:id`: update a document and save the previous version as a revision.
- `GET /api/documents/:id/revisions`: list revision metadata.

Create/update/logout requests require:
- An allowed browser Origin.
- `Content-Type: application/json`.
- `X-KNOT-CSRF` containing the `csrfToken` returned by `GET /api/me`.

Example create body:

```json
{
  "collection": "blog",
  "slug": "hello-knot",
  "title": "Knotへようこそ！",
  "status": "draft",
  "content": {
    "type": "doc",
    "content": []
  }
}
```

Only `draft` and `review` can be created or saved. Published/scheduled states are not writable through this API, and no GitHub publishing action exists yet. Slugs must be lowercase letters, numbers, and hyphens. Document JSON is limited to 200 KiB.

## Test

1. Open `https://knot-cms-api.edanohumio.workers.dev/auth/login`.
2. Authorize using the `knotspace` account.
3. Check `https://knot-cms-api.edanohumio.workers.dev/api/me`; it should return `authenticated: true`.
4. The browser admin UI is a separate next step. Some browsers block third-party cookies from GitHub Pages to `workers.dev`; if that occurs, host the new CMS interface on the Worker origin rather than weakening cookie security.

## Safety and next phase

The current API stores drafts and revisions only. It does not publish to the production Astro site or modify Decap CMS. Before production use, implement the CMS UI on a same-origin host, test session and CSRF behavior in the target browser, and then add a reviewed GitHub publishing workflow.


## Admin interface

The experimental same-origin admin interface is served directly by the Worker:

- `https://knot-cms-api.edanohumio.workers.dev/admin/`
- GitHub OAuth callback returns to this Worker-hosted interface so the HttpOnly cookie is first-party for the CMS.
- The first editor supports title, slug, draft/review status, paragraph/heading/quote/list text blocks, autosave, manual save, and revision metadata.
- It is a first functional draft, not yet a Gutenberg-compatible editor. Image uploads, full visual preview, revision restore, and publishing are not implemented.
- The editor stores structured JSON in D1. Existing Astro content and Decap CMS are not changed.
