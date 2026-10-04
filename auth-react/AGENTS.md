# @yohangel/auth-react — rules for AI agents

## Purpose
React client for a server running `@yohangel/auth` (Next.js, Express, NestJS…): `useSession`, unstyled accessible forms (sign-in with TOTP second step, sign-up, social buttons) and UI guards. Client-only; it never decides access by itself.

## Module map
- `index.ts` — public API.
- `client.ts` — `authClient` (Better Auth React client + 2FA plugin), `useSession`, `signIn`, `signUp`, `signOut`, `AUTH_BASE_URL`.
- `forms.tsx` — `SignInForm`, `SignUpForm`, `SocialButtons`, `defaultLabels` / `AuthLabels`.
- `guard.tsx` — `SignedIn` (render with/without session), `SignOutButton`.

## Integration (do this after installing)
1. Same origin as the API (Next.js, or SPA served by the same server): nothing to configure.
2. API on another origin: set `AUTH_BASE_URL` in `client.ts` to the API URL, add this app's origin to `AUTH_TRUSTED_ORIGINS` on the server, and enable CORS with `credentials: true` there.
3. Pages: `<SignInForm redirectTo="/dashboard" />`, `<SignUpForm redirectTo="/welcome" />`, `<SocialButtons providers={['github']} />` (only providers configured on the server).
4. In Next.js these are Client Components: put `'use client'` in the file that renders them.
5. Translate by passing `labels={{ signIn: '…', password: '…' }}`; style via `className` and the `[data-auth-error]` attribute.

## Conventions
- Use `useSession()` for UI state only (show name, hide buttons). Every protected API/page must check the session on the server.
- Keep the password `minLength` in sync with the server (12).

## Don't
- Don't store tokens in `localStorage`/`sessionStorage`: the session lives in an HttpOnly cookie managed by Better Auth.
- Don't pass absolute URLs from query params to `redirectTo` (the components only follow internal paths).
- Don't log form values or errors that may contain the password.
