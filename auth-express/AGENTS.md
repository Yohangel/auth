# @yohangel/auth-express — rules for AI agents

## Purpose
Connects `@yohangel/auth` to Express 5: mounts Better Auth on `/api/auth/*` and provides `requireAuth` / `optionalAuth` middleware that put the session in `res.locals`.

## Module map
- `index.ts` — `mountAuth(app, opts)`, `requireAuth`, `optionalAuth`, `AuthLocals` type, `createAuth` re-export.

## Integration (do this after installing)
1. Order matters — mount auth BEFORE body parsers:
   ```ts
   import express from 'express';
   import { mountAuth, requireAuth } from './lib/auth-express/index.js';
   const app = express();
   mountAuth(app, { sendEmail });          // /api/auth/*
   app.use(express.json());
   app.get('/api/me', requireAuth, (req, res) => res.json({ id: res.locals.user.id }));
   ```
2. Frontend on another origin: `app.use(cors({ origin: ['https://app.example.com'], credentials: true }))` before `mountAuth`, and list that origin in `AUTH_TRUSTED_ORIGINS`.
3. Behind a proxy/CDN set `app.set('trust proxy', 1)` and `AUTH_IP_HEADER` so rate limits use the real client IP.
4. Express 4 is not supported (route syntax `*splat` is Express 5). Project must be ESM (`"type": "module"`).

## Conventions
- Protect routes with `requireAuth`; read `res.locals.user` / `res.locals.session` (typed by `AuthLocals`).
- Authorization (who can do what) goes in your handlers after `requireAuth`, never on the client.

## Don't
- Don't put `express.json()` before `mountAuth` (Better Auth must read the raw body).
- Don't use `cors({ origin: '*', credentials: true })`.
- Don't return `res.locals.session` (contains the token) to the client.
