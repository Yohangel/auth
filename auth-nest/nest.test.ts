import 'reflect-metadata';
import type { AddressInfo } from 'node:net';
import { Controller, Get, type INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { testDb } from '../auth/__fixtures__/pglite.js';
import { AllowAnonymous, authModule, Session, type UserSession } from './index.js';

@Controller()
class AppController {
  @Get('me')
  me(@Session() session: UserSession) {
    return { email: session.user.email };
  }

  @Get('health')
  @AllowAnonymous()
  health() {
    return { ok: true };
  }
}

let app: INestApplication;
let base = '';

beforeEach(async () => {
  await testDb();
  Object.assign(process.env, { BETTER_AUTH_SECRET: 's'.repeat(40), NODE_ENV: 'test', BETTER_AUTH_URL: 'http://127.0.0.1' });
  @Module({ imports: [authModule()], controllers: [AppController] })
  class AppModule {}
  app = await NestFactory.create(AppModule, { bodyParser: false, logger: false });
  await app.listen(0, '127.0.0.1');
  base = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
});
afterEach(() => app.close());

describe('nest', () => {
  it('guards every route by default and lets @AllowAnonymous through', async () => {
    expect((await fetch(`${base}/health`)).status).toBe(200);
    expect((await fetch(`${base}/me`)).status).toBe(401);
    const headers = { 'content-type': 'application/json', origin: 'http://127.0.0.1' };
    await fetch(`${base}/api/auth/sign-up/email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: 'n@example.com', password: 'a long enough secret', name: 'N' }),
    });
    const res = await fetch(`${base}/api/auth/sign-in/email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: 'n@example.com', password: 'a long enough secret' }),
    });
    const cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
    expect(await (await fetch(`${base}/me`, { headers: { cookie } })).json()).toEqual({ email: 'n@example.com' });
  });
});
