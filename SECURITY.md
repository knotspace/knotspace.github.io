# Security Policy

## Reporting a vulnerability

Do not publish security vulnerabilities in a public issue.

Report suspected vulnerabilities privately to the repository owner through GitHub's private vulnerability reporting feature, if enabled. Include:
- The affected page or feature
- Reproduction steps
- The potential impact
- Any relevant screenshots or request details (remove personal data and tokens)

Please do not include passwords, access tokens, Supabase secret keys, Cloudflare secret keys, or other credentials in reports.

## Security design notes

- Browser-visible Supabase publishable keys and Cloudflare Turnstile sitekeys are public identifiers, not secrets.
- Never commit Supabase secret/service-role keys, Cloudflare Turnstile secret keys, personal access tokens, or passwords.
- Database authorization must be enforced by Supabase Row Level Security (RLS), not by hiding UI elements or checking roles only in browser code.
- GitHub Pages is a static hosting platform. Do not store privileged credentials in client-side code.
- Turnstile is an anti-abuse layer, not a replacement for authentication, RLS, validation, or rate limits.
- Keep dependencies and GitHub Actions updated; review automated security alerts before merging changes.
