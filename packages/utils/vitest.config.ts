import { defineConfig } from 'vitest/config';
import { workspaceAliases } from '../config/vitest-aliases';

export default defineConfig({
  resolve: { alias: workspaceAliases },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
