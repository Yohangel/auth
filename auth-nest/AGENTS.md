# @yohangel/auth-nest — rules for AI agents

## Purpose
Connects `@yohangel/auth` to NestJS (Express platform) through `@thallesp/nestjs-better-auth`: Better Auth routes on `/api/auth/*` and a GLOBAL guard — every route requires a session unless marked otherwise.

## Module map
- `index.ts` — `authModule(opts)`, and the decorators `AllowAnonymous`, `OptionalAuth`, `Session`, type `UserSession`, `AuthGuard`.

## Integration (do this after installing)
1. `main.ts`: `const app = await NestFactory.create(AppModule, { bodyParser: false });` (required).
2. `app.module.ts`: `imports: [authModule({ sendEmail })]`.
3. Public routes: `@AllowAnonymous()` on the handler or controller. Optional session: `@OptionalAuth()`.
4. Read the user: `me(@Session() session: UserSession) { return session.user; }`.
5. Fastify is not supported by this package; use the Express platform.

## Conventions
- Default-deny: new controllers are private automatically; mark public ones explicitly and review every `@AllowAnonymous()`.
- System roles need Better Auth's `admin()` plugin (`createAuth({ plugins: [admin()] })`) and `@Roles(['admin'])` from `@thallesp/nestjs-better-auth`; organization roles use `@OrgRoles` — never mix them.

## Don't
- Don't re-enable Nest's body parser globally (`bodyParser: true`): it breaks Better Auth.
- Don't disable the global guard to "make it work"; add `@AllowAnonymous()` where intended.
- Don't return the session token or `session` object to clients.
