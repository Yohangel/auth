// Guardas de cliente. Solo afectan a lo que se ve: la autorización real siempre se comprueba en el servidor.
import type { ReactNode } from 'react';
import { authClient, useSession } from './client.js';

/** Muestra `children` con sesión; sin ella, `fallback` (p. ej. <SignInForm/> o un enlace a /sign-in). */
export function SignedIn({ children, fallback = null, loading = null }: { children: ReactNode; fallback?: ReactNode; loading?: ReactNode }) {
  const { data, isPending } = useSession();
  if (isPending) return <>{loading}</>;
  return <>{data ? children : fallback}</>;
}

export function SignOutButton({ children = 'Sign out', redirectTo = '/' }: { children?: ReactNode; redirectTo?: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        void authClient.signOut({ fetchOptions: { onSuccess: () => window.location.assign(redirectTo.startsWith('/') ? redirectTo : '/') } })
      }
    >
      {children}
    </button>
  );
}
