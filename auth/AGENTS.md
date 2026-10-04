# @yohangel/auth — rules for AI agents

## Purpose
Server-side authentication core built on Better Auth + Drizzle (Postgres): email/password, GitHub/Google OAuth, TOTP 2FA, database-backed rate limiting and CSRF protection. Framework-agnostic: pair it with `@yohangel/auth-next`, `auth-express` or `auth-nest` (server) and `@yohangel/auth-react` (UI). It does not send emails by itself and has no UI.

## Module map
- `index.ts` — public API. Import only from here.
- `auth.ts` — `createAuth(opts)` (secure defaults), `getAuth()`, `getSession(headers)`, `socialProviders()`.
- `schema.ts` — Drizzle tables: `users`, `sessions`, `accounts`, `verifications`, `two_factors`, `rate_limits`.
- `db.ts` — `setAuthDb(db)` / `getAuthDb()`; defaults to postgres-js from `DATABASE_URL`.

## Integration (do this after installing)
1. Set env vars (add them to `.env.example`, never commit real values):
   - `BETTER_AUTH_SECRET` — 32+ random chars (`openssl rand -base64 32`). Startup throws in production if shorter.
   - `BETTER_AUTH_URL` — public base URL of the server, e.g. `https://app.example.com`.
   - `DATABASE_URL` — Postgres. If the app already has a Drizzle client, pass it: `createAuth({ db })`.
   - Optional: `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (a provider is enabled only when both are set; callback URL is `<BETTER_AUTH_URL>/api/auth/callback/<provider>`), `APP_NAME` (2FA issuer), `AUTH_TRUSTED_ORIGINS` (comma-separated extra origins, e.g. a separate SPA), `AUTH_IP_HEADER` (e.g. `cf-connecting-ip` behind Cloudflare, so rate limits see the real client IP).
2. Add the tables to the app's migrations: include `src/lib/auth/schema.ts` in `drizzle.config.ts` `schema`, then `npx drizzle-kit generate && npx drizzle-kit migrate`.
3. Wire emails: `createAuth({ sendEmail: async ({ kind, to, url, subject, text }) => … })` using the app's mailer. With `sendEmail` set, email verification is required to sign in and password reset is enabled. Without it, links are printed to the console in development only.
4. Create the instance through the framework adapter package (it calls `createAuth` with the right plugins). Use `getSession(headers)` anywhere else on the server.

## Conventions
- One instance per app. Extra Better Auth plugins go in `createAuth({ plugins: [...] })` — e.g. `organization()`, `admin()`, `passkey()` — then regenerate/extend `schema.ts` with the tables those plugins document.
- Always authorize on the server with `getSession()`; client-side checks are only for UX.
- Prefer `overrides` only for options not covered here, and keep the security defaults below.

## Don't
- Don't lower `minPasswordLength` (12), disable `rateLimit` in production, or set `advanced.disableCSRFCheck` / `disableOriginCheck` to `true`.
- Don't log, return or store passwords, session tokens, OAuth tokens or `BETTER_AUTH_SECRET`.
- Don't add origins to `AUTH_TRUSTED_ORIGINS` with wildcards you do not control.
- Don't read `accounts.password` or compare passwords yourself; use Better Auth's API.
- Don't build redirects from user input without checking they are internal paths.

Docs: the Better Auth MCP server (`better-auth`) is configured by GenPM; ask it about plugins and options.
