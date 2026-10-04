# @yohangel/auth-next — rules for AI agents

## Purpose
Connects `@yohangel/auth` to the Next.js App Router (Next 15/16): the `/api/auth/*` route handler, optimistic redirects in `proxy.ts`, and server-side session helpers. For forms and `useSession`, also install `@yohangel/auth-react`.

## Module map
- `index.ts` — public API.
- `server.ts` — `auth` (instance with `nextCookies()`), `authRouteHandlers`, `currentSession()`, `requireSession(signInPath, next)`, `createNextAuth(opts)`.
- `proxy.ts` — `authProxy({ protect, signInPath })` and `safeNext(next)`.

## Integration (do this after installing)
1. Route handler — create `app/api/auth/[...all]/route.ts` (or `src/app/...`):
   ```ts
   import { authRouteHandlers } from '@/lib/auth-next';
   export const { GET, POST } = authRouteHandlers;
   ```
2. Edge redirects — create `proxy.ts` at the project root (Next 16; on Next 15 name it `middleware.ts` and export `middleware`):
   ```ts
   import { authProxy } from '@/lib/auth-next';
   export const proxy = authProxy({ protect: ['/dashboard', '/settings'], signInPath: '/sign-in' });
   export const config = { matcher: ['/dashboard/:path*', '/settings/:path*'] };
   ```
3. In every private page, layout, Route Handler and Server Action, check for real: `const { user } = await requireSession('/sign-in', '/dashboard');`.
4. Sign-in page: render `SignInForm` from `@yohangel/auth-react` with `redirectTo={safeNext(searchParams.next)}`.
5. Need emails or extra plugins? Edit `server.ts`: `export const auth = createNextAuth({ sendEmail, plugins: [...] })` — `nextCookies()` is appended last automatically.

## Conventions
- Import the instance from this package (`auth`), never call `createAuth` again elsewhere in a Next app.
- Server Components read the session with `currentSession()`; pass only the fields the client needs (never the session token).

## Don't
- Don't treat `proxy.ts` as authorization: it only checks that a cookie exists. Always call `requireSession()` / `currentSession()` on the server.
- Don't redirect to `?next=` values without `safeNext()` (open redirect).
- Don't expose `auth.api` calls in Client Components; they run on the server only.
