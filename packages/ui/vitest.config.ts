import { defineConfig } from 'vitest/config';
import { workspaceAliases } from '../config/vitest-aliases';

export default defineConfig({
  resolve: { alias: workspaceAliases },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
