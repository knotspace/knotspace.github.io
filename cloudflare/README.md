# KNOT Cloudflare CMS backend (experimental)

This directory is an isolated bootstrap for a future Cloudflare Workers + D1 backend.
It does **not** replace Decap CMS, change the live publishing flow, or write to GitHub.

## Current state

- `worker.js`: read-only health endpoint at `GET /api/health`.
- `migrations/0001_initial.sql`: draft/revision storage schema for D1.
- `wrangler.toml`: Worker configuration; no database ID or secrets are committed.
- CORS is restricted to the production KNOT origin and local Astro development.
- No write endpoints or public admin token are implemented.

## Local smoke test

Install Wrangler locally (no global install required):

```sh
npx wrangler dev --config cloudflare/wrangler.toml
```

Then open `http://localhost:8787/api/health`. Before D1 is attached, the response reports
`database: "not_configured"`. This is expected.

## Connect a free D1 database

1. Sign in to your own Cloudflare account.
2. Create a D1 database named `knot-cms` in the Cloudflare dashboard.
3. Copy its database ID into the `database_id` field in `wrangler.toml`.
4. Uncomment the D1 binding block in `wrangler.toml`.
5. Apply the schema with:

```sh
npx wrangler d1 migrations apply knot-cms --remote --config cloudflare/wrangler.toml
```

6. Deploy the Worker:

```sh
npx wrangler deploy --config cloudflare/wrangler.toml
```

Do not commit API tokens, OAuth secrets, GitHub tokens, or other credentials. Add them with
`wrangler secret put SECRET_NAME --config cloudflare/wrangler.toml`.

## Before enabling editing

A real authentication flow is required before adding any create/update/delete API.
Do not put a shared secret in browser JavaScript: every visitor can read it. The next phase
should use Cloudflare Access or a server-side GitHub OAuth flow, then validate every write
and publish operation. Keep GitHub Pages as the production frontend until the new flow has
been tested end-to-end.
