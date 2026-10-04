// @yohangel/auth-nest — Better Auth en NestJS (plataforma Express) vía @thallesp/nestjs-better-auth.
// Registra un AuthGuard GLOBAL: toda ruta exige sesión salvo @AllowAnonymous() u @OptionalAuth().
// main.ts: `NestFactory.create(AppModule, { bodyParser: false })` (Better Auth lee el cuerpo; el módulo vuelve a
// activar json/urlencoded para el resto de rutas).
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { type CreateAuthOptions, createAuth } from '../auth/index.js';

/** `imports: [authModule()]` en tu AppModule. */
export function authModule(opts: CreateAuthOptions = {}) {
  return AuthModule.forRoot({ auth: createAuth(opts) });
}

export {
  AllowAnonymous,
  AuthGuard,
  OptionalAuth,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';
