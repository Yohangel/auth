// @yohangel/auth — API pública (Better Auth + Drizzle). Importa desde aquí; los adaptadores de framework viven en
// @yohangel/auth-next, auth-express y auth-nest.
export {
  type Auth,
  type AuthEmail,
  type AuthSession,
  type CreateAuthOptions,
  createAuth,
  getAuth,
  getSession,
  socialProviders,
} from './auth.js';
export {
  accounts,
  authSchema,
  rateLimits,
  type Session,
  sessions,
  twoFactors,
  type User,
  users,
  verifications,
} from './schema.js';
export { type AuthDb, getAuthDb, setAuthDb } from './db.js';
