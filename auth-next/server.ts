// Servidor (App Router): instancia de la app con `nextCookies()` (para que las Server Actions puedan fijar cookies),
// handler de las rutas /api/auth/* y helpers de sesión para Server Components, Route Handlers y Server Actions.
import { nextCookies, toNextJsHandler } from 'better-auth/next-js';
import { headers } from 'next/headers.js';
import { redirect } from 'next/navigation.js';
import { type AuthSession, type CreateAuthOptions, createAuth } from '../auth/index.js';

/** Plugins extra van antes de `nextCookies()`, que debe ser el último. */
export function createNextAuth(opts: CreateAuthOptions = {}) {
  return createAuth({ ...opts, plugins: [...(opts.plugins ?? []), nextCookies()] });
}

export const auth = createNextAuth();

/** app/api/auth/[...all]/route.ts → `export const { GET, POST } = authRouteHandlers;` */
export const authRouteHandlers = toNextJsHandler(auth);

/** Sesión de la petición actual (null si no hay). Comprobación real contra la BD (o su caché firmada). */
export async function currentSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

/** Exige sesión: si no la hay, redirige a `signInPath` con `?next=` para volver después. */
export async function requireSession(signInPath = '/sign-in', next?: string): Promise<AuthSession> {
  const s = await currentSession();
  if (!s) redirect(next ? `${signInPath}?next=${encodeURIComponent(next)}` : signInPath);
  return s;
}
