import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';
import { workspaceAliases } from '../../packages/config/vitest-aliases';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), ...workspaceAliases },
  },
  test: {
    testTimeout: 20_000,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
