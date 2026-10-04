import { beforeEach, describe, expect, it } from 'vitest';
import { testDb } from './__fixtures__/pglite.js';
import { type AuthEmail, createAuth, getAuth, getAuthDb, getSession } from './index.js';
import * as schema from './schema.js';

const BASE = 'http://localhost:3000';

beforeEach(async () => {
  Object.assign(process.env, { BETTER_AUTH_SECRET: 's'.repeat(40), BETTER_AUTH_URL: BASE, NODE_ENV: 'test' });
  delete process.env.AUTH_RATE_LIMIT;
  delete process.env.GITHUB_CLIENT_ID;
  await testDb();
});

// Mini app: las rutas de Better Auth y una ruta privada que exige sesión.
function app() {
  return {
    request: async (url: string, init: RequestInit = {}) => {
      const req = new Request(url, init);
      if (new URL(url).pathname.startsWith('/api/auth/')) return getAuth().handler(req);
      const s = await getSession(req.headers);
      return s ? Response.json({ email: s.user.email }) : Response.json({ error: 'unauthorized' }, { status: 401 });
    },
  };
}

const post = (a: ReturnType<typeof app>, path: string, body: unknown, headers: Record<string, string> = {}) =>
  a.request(`${BASE}/api/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE, ...headers },
    body: JSON.stringify(body),
  });

const cookieOf = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');

describe('email + password', () => {
  it('signs up, signs in and loads the session', async () => {
    createAuth();
    const a = app();
    const up = await post(a, '/sign-up/email', { email: 'ana@example.com', password: 'correct horse battery', name: 'Ana' });
    expect(up.status).toBe(200);
    const res = await post(a, '/sign-in/email', { email: 'ana@example.com', password: 'correct horse battery' });
    expect(res.status).toBe(200);
    const cookie = cookieOf(res);
    expect(cookie).toContain('better-auth.session_token');
    const me = await a.request(`${BASE}/me`, { headers: { cookie } });
    expect(await me.json()).toEqual({ email: 'ana@example.com' });
    expect((await getSession(new Headers({ cookie })))?.user.email).toBe('ana@example.com');
  });

  it('rejects short passwords and wrong credentials, and protects private routes', async () => {
    createAuth();
    const a = app();
    expect((await post(a, '/sign-up/email', { email: 'b@example.com', password: 'short', name: 'B' })).status).toBe(400);
    await post(a, '/sign-up/email', { email: 'c@example.com', password: 'a long enough secret', name: 'C' });
    expect((await post(a, '/sign-in/email', { email: 'c@example.com', password: 'wrong password here' })).status).toBe(401);
    expect((await a.request(`${BASE}/me`)).status).toBe(401);
  });

  it('stores only a scrypt hash, never the password', async () => {
    createAuth();
    await post(app(), '/sign-up/email', { email: 'd@example.com', password: 'plain text never stored', name: 'D' });
    const [row] = await getAuthDb().select().from(schema.accounts);
    expect(row?.providerId).toBe('credential');
    expect(row?.password).not.toContain('plain text');
    expect(row?.password?.length).toBeGreaterThan(40);
  });

  it('requires email verification when an email sender is configured', async () => {
    const sent: AuthEmail[] = [];
    createAuth({ sendEmail: async (m) => void sent.push(m) });
    const a = app();
    await post(a, '/sign-up/email', { email: 'e@example.com', password: 'verify me please now', name: 'E' });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ kind: 'verify-email', to: 'e@example.com' });
    expect(sent[0]!.url).toContain(`${BASE}/api/auth/verify-email`);
    expect((await post(a, '/sign-in/email', { email: 'e@example.com', password: 'verify me please now' })).status).toBe(403);
  });
});

describe('hardening', () => {
  it('blocks cross-site requests (CSRF) with and without a session', async () => {
    createAuth();
    const a = app();
    await post(a, '/sign-up/email', { email: 'x@example.com', password: 'a long enough secret', name: 'X' });
    const cookie = cookieOf(await post(a, '/sign-in/email', { email: 'x@example.com', password: 'a long enough secret' }));
    // Con sesión: un sitio ajeno no puede cambiar datos de la cuenta aunque el navegador envíe la cookie.
    const withSession = await post(a, '/update-user', { name: 'Hacked' }, { origin: 'https://evil.example', cookie });
    expect(withSession.status).toBe(403);
    // Sin sesión: un formulario de otro sitio no puede iniciar sesión en nombre del usuario (login CSRF).
    const firstLogin = await post(
      a,
      '/sign-in/email',
      { email: 'x@example.com', password: 'a long enough secret' },
      { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'navigate' },
    );
    expect(firstLogin.status).toBe(403);
  });

  it('rate limits sign-in attempts per IP', async () => {
    process.env.AUTH_RATE_LIMIT = '1';
    createAuth();
    const a = app();
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const r = await post(a, '/sign-in/email', { email: 'f@example.com', password: 'wrong password again' }, { 'x-forwarded-for': '203.0.113.7' });
      statuses.push(r.status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 401)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });

  it('refuses a weak secret in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.BETTER_AUTH_SECRET = 'short';
    expect(() => createAuth()).toThrow(/BETTER_AUTH_SECRET/);
    process.env.NODE_ENV = 'test';
  });

  it('enables OAuth providers only when configured', async () => {
    const { socialProviders } = await import('./index.js');
    expect(Object.keys(socialProviders())).toEqual([]);
    process.env.GITHUB_CLIENT_ID = 'id';
    process.env.GITHUB_CLIENT_SECRET = 'secret';
    expect(Object.keys(socialProviders())).toEqual(['github']);
  });
});
