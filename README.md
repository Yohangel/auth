# @yohangel/auth

Secure login for **Next.js, React, Express and NestJS**, built on [Better Auth](https://better-auth.com) + Drizzle (Postgres) and distributed as source with [GenPM](https://genpm.net): the code lands in your project, together with rules for your AI agent and the Better Auth MCP server.

| Package | What you get | Install |
|---|---|---|
| `@yohangel/auth` | Core: email/password, GitHub/Google, 2FA (TOTP), rate limits, CSRF, Drizzle tables | `genpm add @yohangel/auth` |
| `@yohangel/auth-next` | App Router route handler, `proxy.ts` redirects, `requireSession()` | `genpm add @yohangel/auth-next` |
| `@yohangel/auth-react` | `useSession`, sign-in (with 2FA step), sign-up, social buttons, guards | `genpm add @yohangel/auth-react` |
| `@yohangel/auth-express` | `mountAuth(app)`, `requireAuth`, `optionalAuth` (Express 5) | `genpm add @yohangel/auth-express` |
| `@yohangel/auth-nest` | Global guard, `@AllowAnonymous`, `@OptionalAuth`, `@Session` | `genpm add @yohangel/auth-nest` |

Adapters depend on `@yohangel/auth`, so GenPM installs the core for you. Typical stacks:

- **Next.js:** `genpm add @yohangel/auth-next @yohangel/auth-react`
- **React SPA + Express API:** `genpm add @yohangel/auth-react` (frontend) and `genpm add @yohangel/auth-express` (API)
- **NestJS API:** `genpm add @yohangel/auth-nest`

## Security defaults

- Passwords: 12–128 characters, hashed with scrypt; sessions revoked on password reset.
- Email verification required as soon as you plug in an email sender.
- Rate limits stored in the database (works across serverless instances): 5 sign-ins/min, 3 sign-ups/min, 3 reset requests/5 min, 5 2FA attempts/min per IP.
- CSRF: Origin and Fetch Metadata checks always on (never disabled by `NODE_ENV`).
- Cookies HttpOnly, Secure (HTTPS) and SameSite=Lax; sessions last 30 days, refreshed daily.
- Refuses to start in production with a `BETTER_AUTH_SECRET` shorter than 32 characters.
- OAuth providers only enabled when both their client id and secret are set.

## Configuration

Copy `.env.example`. Required: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`. See each package's `AGENTS.md` for step-by-step integration.

## Development

```bash
pnpm install
pnpm test        # Postgres in WASM (PGlite): sign-up/in, CSRF, rate limits, Express and NestJS end to end
pnpm typecheck
```

Each folder is a GenPM package (`<folder>/genpm.json`), released with per-package tags such as `auth@1.0.0` or `auth-next@1.0.0`.

MIT © Yohangel
