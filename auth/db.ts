// Base de datos de @yohangel/auth: cualquier Drizzle sobre Postgres (postgres-js, Neon, PGlite…). Si tu app ya
// tiene un cliente Drizzle, pásalo con `createAuth({ db })` o `setAuthDb(db)`; si no, se crea desde DATABASE_URL.
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// biome-ignore lint/suspicious/noExplicitAny: acepta el Drizzle de la app con cualquier esquema.
export type AuthDb = PgDatabase<PgQueryResultHKT, any>;

let current: AuthDb | null = null;

export function setAuthDb(db: AuthDb): void {
  current = db;
}

export function getAuthDb(): AuthDb {
  if (current) return current;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (or pass `db` to createAuth)');
  current = drizzle(postgres(url, { max: 5, prepare: false })) as unknown as AuthDb;
  return current;
}
