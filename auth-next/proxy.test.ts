import { NextRequest } from 'next/server.js';
import { describe, expect, it } from 'vitest';
import { authProxy, safeNext } from './proxy.js';

const proxy = authProxy({ protect: ['/dashboard'], signInPath: '/sign-in' });

describe('authProxy', () => {
  it('redirects private routes without a session cookie, keeping where to return', () => {
    const res = proxy(new NextRequest('https://app.example/dashboard/billing?tab=1'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://app.example/sign-in?next=%2Fdashboard%2Fbilling%3Ftab%3D1');
  });

  it('lets public routes and requests with a session cookie through', () => {
    expect(proxy(new NextRequest('https://app.example/pricing')).headers.get('location')).toBeNull();
    const withCookie = new NextRequest('https://app.example/dashboard', {
      headers: { cookie: 'better-auth.session_token=abc.def' },
    });
    expect(proxy(withCookie).headers.get('location')).toBeNull();
  });

  it('only accepts internal ?next= targets (no open redirects)', () => {
    expect(safeNext('/settings')).toBe('/settings');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext('//evil.example')).toBe('/');
    expect(safeNext('/\\evil.example')).toBe('/');
    expect(safeNext(null, '/home')).toBe('/home');
  });
});
