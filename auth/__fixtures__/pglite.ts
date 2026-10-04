// Solo tests (excluido por .genpmignore): Postgres real en WASM con PGlite y las tablas de schema.ts.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { type AuthDb, setAuthDb } from '../db.js';
import * as schema from '../schema.js';

export async function testDb(): Promise<AuthDb> {
  const { generateDrizzleJson, generateMigration } = await import('drizzle-kit/api');
  const statements = await generateMigration(generateDrizzleJson({}), generateDrizzleJson(schema));
  const client = new PGlite();
  for (const s of statements) await client.exec(s);
  const db = drizzle(client) as unknown as AuthDb;
  setAuthDb(db);
  return db;
}
