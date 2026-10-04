import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { testDb } from '../auth/__fixtures__/pglite.js';
import { mountAuth, requireAuth } from './index.js';

let server: ReturnType<express.Express['listen']> | null = null;
let base = '';

beforeEach(async () => {
  await testDb();
  const app = express();
  // El handler de Better Auth va antes de express.json() (lee el cuerpo él mismo).
  process.env.BETTER_AUTH_SECRET = 's'.repeat(40);
  process.env.NODE_ENV = 'test';
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  base = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
  process.env.BETTER_AUTH_URL = base;
  mountAuth(app);
  app.use(express.json());
  app.get('/api/me', requireAuth, (_req, res) => {
    res.json({ email: res.locals.user.email });
  });
});
afterEach(() => new Promise<void>((r) => server?.close(() => r())));

const post = (path: string, body: unknown) =>
  fetch(`${base}/api/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base },
    body: JSON.stringify(body),
  });

describe('express', () => {
  it('mounts Better Auth and protects routes with requireAuth', async () => {
    expect((await fetch(`${base}/api/me`)).status).toBe(401);
    expect((await post('/sign-up/email', { email: 'x@example.com', password: 'a long enough secret', name: 'X' })).status).toBe(200);
    const res = await post('/sign-in/email', { email: 'x@example.com', password: 'a long enough secret' });
    const cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
    const me = await fetch(`${base}/api/me`, { headers: { cookie } });
    expect(await me.json()).toEqual({ email: 'x@example.com' });
  });
});
