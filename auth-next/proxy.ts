// Protección optimista en el borde (Next 16 `proxy.ts`, o `middleware.ts` en Next 15): solo mira si existe la
// cookie de sesión, sin tocar la BD. NO es una comprobación de seguridad: valida siempre con `requireSession()` en
// la página o acción. Sirve para redirigir rápido a quien claramente no ha iniciado sesión.
import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server.js';

export type AuthProxyOptions = {
  /** Prefijos de ruta privados, p. ej. ['/dashboard', '/settings']. */
  protect: string[];
  /** Página de inicio de sesión. */
  signInPath?: string;
};

export function authProxy({ protect, signInPath = '/sign-in' }: AuthProxyOptions) {
  return (request: NextRequest) => {
    const { pathname, search } = request.nextUrl;
    const isPrivate = protect.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!isPrivate || getSessionCookie(request)) return NextResponse.next();
    const url = new URL(signInPath, request.url);
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  };
}

/** Solo rutas internas: evita redirecciones abiertas con `?next=https://evil.example`. */
export function safeNext(next: string | null | undefined, fallback = '/'): string {
  return next?.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback;
}
