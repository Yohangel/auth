import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SignInForm, SignUpForm, SocialButtons } from './index.js';

describe('forms', () => {
  it('render labelled, autocomplete-friendly fields', () => {
    const html = renderToString(<SignInForm />);
    expect(html).toMatch(/autocomplete="current-password"/i);
    expect(html).toContain('type="email"');
    expect(html).toContain('Sign in');
  });

  it('enforce the server password policy on sign-up and accept translated labels', () => {
    const html = renderToString(<SignUpForm labels={{ signUp: 'Crear cuenta', passwordHint: 'Mínimo 12 caracteres.' }} />);
    expect(html).toContain('minLength="12"');
    expect(html).toContain('Crear cuenta');
    expect(html).toContain('Mínimo 12 caracteres.');
  });

  it('render one button per provider', () => {
    const html = renderToString(<SocialButtons providers={['github', 'google']} />).replace(/<!-- -->/g, '');
    expect(html).toContain('Continue with GitHub');
    expect(html).toContain('Continue with Google');
  });
});
