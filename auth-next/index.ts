// @yohangel/auth-next — Better Auth en Next.js (App Router). Servidor: './server.js'; borde: './proxy.js'.
// El cliente (formularios, useSession) está en @yohangel/auth-react.
export { type AuthProxyOptions, authProxy, safeNext } from './proxy.js';
export { auth, authRouteHandlers, createNextAuth, currentSession, requireSession } from './server.js';
