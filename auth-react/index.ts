// @yohangel/auth-react — cliente de Better Auth para React: hooks, formularios y guardas. Funciona con cualquier
// servidor que monte @yohangel/auth (Next.js, Express, NestJS…).
export { AUTH_BASE_URL, authClient, signIn, signOut, signUp, useSession } from './client.js';
export { type AuthLabels, defaultLabels, SignInForm, SignUpForm, SocialButtons } from './forms.js';
export { SignedIn, SignOutButton } from './guard.js';
