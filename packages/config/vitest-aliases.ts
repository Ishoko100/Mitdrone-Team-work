import { fileURLToPath } from 'node:url';

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export const workspaceAliases = {
  '@mitdrone/types': source('../types/src/index.ts'),
  '@mitdrone/ui': source('../ui/src/index.ts'),
  '@mitdrone/sdk': source('../sdk/src/index.ts'),
  '@mitdrone/auth': source('../auth/src/index.ts'),
  '@mitdrone/utils': source('../utils/src/index.ts'),
  '@mitdrone/mocks/node': source('../mocks/src/node.ts'),
  '@mitdrone/mocks/browser': source('../mocks/src/browser.ts'),
  '@mitdrone/mocks/fetch': source('../mocks/src/mock-fetch.ts'),
  '@mitdrone/mocks': source('../mocks/src/index.ts'),
  '@mitdrone/data': source('../data/src/index.ts'),
};
