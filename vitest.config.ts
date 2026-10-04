import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['auth*/**/*.test.ts', 'auth*/**/*.test.tsx'], testTimeout: 30000 },
});
