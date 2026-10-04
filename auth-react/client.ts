// Cliente de Better Auth para React (Next.js, Vite, Remix…). Mismo origen por defecto: si tu API vive en otro
// dominio, pon aquí su URL y añade el origen de esta app a AUTH_TRUSTED_ORIGINS en el servidor.
import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const AUTH_BASE_URL: string | undefined = undefined;

export const authClient = createAuthClient({
  ...(AUTH_BASE_URL ? { baseURL: AUTH_BASE_URL } : {}),
  plugins: [twoFactorClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
