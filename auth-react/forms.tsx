// Formularios accesibles y sin estilos propios (usa `className`): inicio de sesión (con segundo factor si la
// cuenta lo tiene), registro y botones de proveedores. Los textos se pasan por `labels` para traducirlos.
import { type FormEvent, useState } from 'react';
import { authClient } from './client.js';

export type AuthLabels = {
  email: string;
  password: string;
  name: string;
  signIn: string;
  signUp: string;
  code: string;
  verify: string;
  continueWith: string;
  working: string;
  passwordHint: string;
};

export const defaultLabels: AuthLabels = {
  email: 'Email',
  password: 'Password',
  name: 'Name',
  signIn: 'Sign in',
  signUp: 'Create account',
  code: 'Authentication code',
  verify: 'Verify',
  continueWith: 'Continue with',
  working: 'Please wait…',
  passwordHint: 'At least 12 characters.',
};

type Common = {
  /** Adónde ir al terminar. Solo rutas internas (empiezan por "/"). */
  redirectTo?: string;
  labels?: Partial<AuthLabels>;
  className?: string;
  onSuccess?: () => void;
};

const internal = (to: string | undefined) => (to?.startsWith('/') && !to.startsWith('//') ? to : '/');

function useForm(onSuccess: (() => void) | undefined, redirectTo: string | undefined) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<{ error?: { message?: string } | null } | undefined | null>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res?.error) setError(res.error.message ?? 'Error');
      else if (onSuccess) onSuccess();
      else if (typeof window !== 'undefined') window.location.assign(internal(redirectTo));
    } finally {
      setBusy(false);
    }
  };
  return { error, busy, run };
}

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" data-auth-error="">
      {error}
    </p>
  ) : null;
}

export function SignInForm({ redirectTo, labels, className, onSuccess }: Common) {
  const L = { ...defaultLabels, ...labels };
  const { error, busy, run } = useForm(onSuccess, redirectTo);
  const [needsCode, setNeedsCode] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (needsCode)
      return void run(() => authClient.twoFactor.verifyTotp({ code: String(f.get('code') ?? ''), trustDevice: true }));
    void run(async () => {
      const res = await authClient.signIn.email({
        email: String(f.get('email') ?? ''),
        password: String(f.get('password') ?? ''),
      });
      // Cuenta con 2FA: Better Auth no crea la sesión hasta verificar el código.
      if ((res.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
        setNeedsCode(true);
        return { error: null, pending: true } as never;
      }
      return res;
    });
  };
  return (
    <form className={className} onSubmit={submit} noValidate={false}>
      {needsCode ? (
        <label>
          {L.code}
          <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required />
        </label>
      ) : (
        <>
          <label>
            {L.email}
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            {L.password}
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
        </>
      )}
      <ErrorText error={error} />
      <button type="submit" disabled={busy}>
        {busy ? L.working : needsCode ? L.verify : L.signIn}
      </button>
    </form>
  );
}

export function SignUpForm({ redirectTo, labels, className, onSuccess }: Common) {
  const L = { ...defaultLabels, ...labels };
  const { error, busy, run } = useForm(onSuccess, redirectTo);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void run(() =>
      authClient.signUp.email({
        name: String(f.get('name') ?? ''),
        email: String(f.get('email') ?? ''),
        password: String(f.get('password') ?? ''),
      }),
    );
  };
  return (
    <form className={className} onSubmit={submit}>
      <label>
        {L.name}
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        {L.email}
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        {L.password}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
          aria-describedby="auth-password-hint"
        />
        <small id="auth-password-hint">{L.passwordHint}</small>
      </label>
      <ErrorText error={error} />
      <button type="submit" disabled={busy}>
        {busy ? L.working : L.signUp}
      </button>
    </form>
  );
}

/** Un botón por proveedor. Solo funcionan los configurados en el servidor (GITHUB_*, GOOGLE_*). */
export function SocialButtons({
  providers,
  redirectTo,
  labels,
  className,
}: Common & { providers: Array<'github' | 'google'> }) {
  const L = { ...defaultLabels, ...labels };
  const names = { github: 'GitHub', google: 'Google' } as const;
  return (
    <div className={className}>
      {providers.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => void authClient.signIn.social({ provider: p, callbackURL: internal(redirectTo) })}
        >
          {L.continueWith} {names[p]}
        </button>
      ))}
    </div>
  );
}
