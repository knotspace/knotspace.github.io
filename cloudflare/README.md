# KNOT Cloudflare CMS backend (experimental)

This directory contains an experimental Cloudflare Workers + D1 backend for KNOT.
The existing Decap CMS and GitHub Pages publishing flow remain unchanged.

## Current backend

- `worker.js`: health check, GitHub OAuth login/callback, session check, and logout.
- `migrations/0001_initial.sql`: document and revision tables in D1.
- `wrangler.toml`: Worker and D1 binding, plus the public GitHub OAuth Client ID.
- Only the GitHub account `knotspace` is accepted as administrator.
- No document write or GitHub publishing endpoints exist yet.

## Configure OAuth secrets

Create a GitHub OAuth App with these exact values:

- Homepage URL: `https://knotspace.github.io`
- Authorization callback URL: `https://knot-cms-api.edanohumio.workers.dev/auth/callback`

The Client ID is stored as a public Worker variable in `wrangler.toml`.
Never commit the Client Secret or session signing key.

From this directory, run:

```sh
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Paste the OAuth App Client Secret into the hidden terminal prompt (do not paste it into chat).

Generate a separate random session signing key locally:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Copy the generated value, then run:

```sh
npx wrangler secret put SESSION_SECRET
```

Paste the generated value into the hidden prompt. Do not reuse the GitHub Client Secret as the session key.

Deploy the updated Worker:

```sh
npx wrangler deploy
```

## Authentication endpoints

- `GET /auth/login`: starts GitHub OAuth.
- `GET /auth/callback`: validates OAuth state, exchanges the code server-side, checks the GitHub login, and issues an HttpOnly session cookie.
- `GET /api/me`: returns the current administrator session status.
- `POST /auth/logout`: clears the session cookie.
- `GET /api/health`: reports Worker and D1 connectivity.

The session is signed with HMAC-SHA-256, expires after 8 hours, and is restricted to the `knotspace` GitHub login. The GitHub access token is not stored.

## Test

1. Open `https://knot-cms-api.edanohumio.workers.dev/auth/login`.
2. Authorize the GitHub OAuth App using the `knotspace` account.
3. The callback should redirect to `https://knotspace.github.io/admin/?knot_login=success`.
4. Check the session from the browser developer console on the KNOT site with:

```js
fetch("https://knot-cms-api.edanohumio.workers.dev/api/me", {
  credentials: "include"
}).then(r => r.json()).then(console.log)
```

A successful response has `authenticated: true` and `login: "knotspace"`.
Some browsers block third-party cookies; if the session check returns unauthenticated after a successful redirect, stop and revisit the session transport design rather than weakening cookie security.

## Safety and next phase

The current OAuth flow only authenticates an administrator. It does not yet authorize document writes because no write endpoints are implemented. Before adding create/update/delete or publish endpoints, add CSRF protections and strict input validation, then test against staging. Keep GitHub Pages as the production frontend until the complete workflow is tested end-to-end.
