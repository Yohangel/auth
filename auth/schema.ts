// Tablas de @yohangel/auth (Better Auth 1.7: núcleo + twoFactor + rateLimit). Añádelas al `schema` de tu drizzle.config.ts.
// Nombres en plural y snake_case en SQL; las claves JS son las que espera Better Auth.
import { bigint, boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const createdAt = ts('created_at').defaultNow().notNull();
const updatedAt = ts('updated_at')
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull();

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  createdAt,
  updatedAt,
});

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    // Better Auth guarda el token firmado de la cookie; la cookie además lleva HMAC con BETTER_AUTH_SECRET.
    token: text('token').notNull().unique(),
    expiresAt: ts('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt,
    updatedAt,
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

/** Una fila por forma de entrar: `credential` (email+contraseña, hash scrypt en `password`) o un proveedor OAuth. */
export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: ts('access_token_expires_at'),
    refreshTokenExpiresAt: ts('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt,
    updatedAt,
  },
  (t) => [index('accounts_user_idx').on(t.userId)],
);

/** Tokens de un solo uso: verificación de email, restablecer contraseña, estado OAuth. */
export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: ts('expires_at').notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
);

export const twoFactors = pgTable(
  'two_factors',
  {
    id: text('id').primaryKey(),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    verified: boolean('verified').default(true),
    failedVerificationCount: integer('failed_verification_count').default(0),
    lockedUntil: ts('locked_until'),
  },
  (t) => [index('two_factors_user_idx').on(t.userId)],
);

/** Límite de peticiones compartido entre instancias (serverless): el de memoria no sirve con varias réplicas. */
export const rateLimits = pgTable('rate_limits', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});

/** Modelo de Better Auth → tabla Drizzle (se pasa al adaptador). */
export const authSchema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
  twoFactor: twoFactors,
  rateLimit: rateLimits,
};

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
