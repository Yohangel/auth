// @yohangel/auth-express — Better Auth en Express 5. Monta las rutas ANTES de express.json() y protege rutas con
// `requireAuth`. La sesión queda en `res.locals.session` / `res.locals.user`.
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import type { Express, NextFunction, Request, RequestHandler, Response } from 'express';
import { type AuthSession, type CreateAuthOptions, createAuth, getAuth } from '../auth/index.js';

export { createAuth };

/** Crea la instancia (si no existe) y monta /api/auth/* (Express 5: `*splat`). Llamar antes de `express.json()`. */
export function mountAuth(app: Express, opts: CreateAuthOptions & { basePath?: string } = {}): void {
  const { basePath = '/api/auth', ...authOpts } = opts;
  const auth = createAuth(authOpts);
  app.all(`${basePath}/*splat`, toNodeHandler(auth));
}

export type AuthLocals = { session: AuthSession['session'] | null; user: AuthSession['user'] | null };

async function load(req: Request, res: Response): Promise<AuthSession | null> {
  const s = await getAuth().api.getSession({ headers: fromNodeHeaders(req.headers) });
  res.locals.session = s?.session ?? null;
  res.locals.user = s?.user ?? null;
  return s;
}

/** 401 JSON si no hay sesión válida. */
export const requireAuth: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(await load(req, res))) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  } catch (e) {
    next(e);
  }
};

/** Carga la sesión si existe, sin bloquear. */
export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    await load(req, res);
    next();
  } catch (e) {
    next(e);
  }
};
