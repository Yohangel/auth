// Instancia de Better Auth con valores seguros por defecto. Los adaptadores de framework (auth-next, auth-express,
// auth-nest) llaman a `createAuth()` con sus plugins; el resto del código usa `getAuth()` / `getSession()`.
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { type BetterAuthOptions, type BetterAuthPlugin, betterAuth } from 'better-auth';
import { twoFactor } from 'better-auth/plugins';
import { type AuthDb, getAuthDb, setAuthDb } from './db.js';
import { authSchema } from './schema.js';

/** Correo que Better Auth necesita enviar. `subject` y `text` son un texto por defecto en inglés; usa `kind` y `url`
 * para tus propias plantillas (p. ej. Resend o tu mailer). */
export type AuthEmail = {
  kind: 'verify-email' | 'reset-password';
  to: string;
  url: string;
  subject: string;
  text: string;
};

export type CreateAuthOptions = {
  /** Tu cliente Drizzle (Postgres). Por defecto, uno creado desde DATABASE_URL. */
  db?: AuthDb;
  /** Plugins extra de Better Auth (organization, passkey, magicLink…). `nextCookies()` siempre el último. */
  plugins?: BetterAuthPlugin[];
  /** Envío de correos de verificación y de restablecer contraseña. Sin él: en desarrollo se imprimen los enlaces
   * en consola; en producción no se exige verificar el email y restablecer contraseña queda desactivado. */
  sendEmail?: (email: AuthEmail) => Promise<void>;
  /** Sobrescribe cualquier opción de Better Auth (se aplica al final; úsalo con cuidado). */
  overrides?: Partial<BetterAuthOptions>;
};

const isProd = () => process.env.NODE_ENV === 'production';
const list = (v: string | undefined) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function checkSecret(): void {
  const secret = process.env.BETTER_AUTH_SECRET ?? '';
  if (isProd() && secret.length < 32)
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters (openssl rand -base64 32)');
}

/** Proveedores OAuth activos: solo los que tienen client id y secret en el entorno. */
export function socialProviders(): NonNullable<BetterAuthOptions['socialProviders']> {
  const out: NonNullable<BetterAuthOptions['socialProviders']> = {};
  const e = process.env;
  if (e.GITHUB_CLIENT_ID && e.GITHUB_CLIENT_SECRET)
    out.github = { clientId: e.GITHUB_CLIENT_ID, clientSecret: e.GITHUB_CLIENT_SECRET };
  if (e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET)
    out.google = { clientId: e.GOOGLE_CLIENT_ID, clientSecret: e.GOOGLE_CLIENT_SECRET };
  return out;
}

export function createAuth(opts: CreateAuthOptions = {}) {
  checkSecret();
  if (opts.db) setAuthDb(opts.db);
  const appName = process.env.APP_NAME ?? 'App';
  const send =
    opts.sendEmail ??
    (isProd()
      ? null
      : async (m: AuthEmail) => {
          console.info(`[auth] ${m.kind} for ${m.to}: ${m.url}`);
        });
  const ipHeader = process.env.AUTH_IP_HEADER;
  const options = {
    appName,
    database: drizzleAdapter(getAuthDb(), { provider: 'pg', schema: authSchema }),
    trustedOrigins: list(process.env.AUTH_TRUSTED_ORIGINS),
    emailAndPassword: {
      enabled: true,
      // NIST 800-63B: mínimo largo antes que reglas de composición. Hash scrypt (por defecto en Better Auth).
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: !!opts.sendEmail,
      revokeSessionsOnPasswordReset: true,
      ...(send
        ? {
            sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) =>
              send({
                kind: 'reset-password',
                to: user.email,
                url,
                subject: `Reset your ${appName} password`,
                text: `Open this link to choose a new password (valid for 1 hour): ${url}\n\nIf you did not ask for it, ignore this email.`,
              }),
          }
        : {}),
    },
    ...(send
      ? {
          emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) =>
              send({
                kind: 'verify-email',
                to: user.email,
                url,
                subject: `Verify your ${appName} email`,
                text: `Confirm your email address: ${url}`,
              }),
          },
        }
      : {}),
    socialProviders: socialProviders(),
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      // Caché firmada en cookie: menos lecturas de BD; una sesión revocada deja de valer en ≤ 5 min.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    rateLimit: {
      enabled: isProd() || process.env.AUTH_RATE_LIMIT === '1',
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
        '/request-password-reset': { window: 300, max: 3 },
        '/two-factor/*': { window: 60, max: 5 },
      },
    },
    advanced: {
      // Explícitos: Better Auth los desactiva solo si NODE_ENV=test; aquí la protección CSRF nunca depende del entorno.
      disableCSRFCheck: false,
      disableOriginCheck: false,
      ...(ipHeader ? { ipAddress: { ipAddressHeaders: [ipHeader] } } : {}),
    },
    plugins: [twoFactor({ issuer: appName }), ...(opts.plugins ?? [])],
    ...opts.overrides,
  } satisfies BetterAuthOptions;
  const instance = betterAuth(options);
  current = instance as unknown as Auth;
  return instance;
}

export type Auth = ReturnType<typeof createAuth>;

let current: Auth | null = null;

/** La instancia de la app (la última creada con `createAuth`, o una por defecto sin plugins extra). */
export function getAuth(): Auth {
  current ??= createAuth();
  return current;
}

export type AuthSession = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;

/** Sesión y usuario de una petición a partir de sus cabeceras (null si no hay sesión válida). */
export async function getSession(headers: Headers): Promise<AuthSession | null> {
  return getAuth().api.getSession({ headers });
}
