import { AuthController, AuthProvider } from '@mitdrone/auth';
import { resetDb, setMockConfig } from '@mitdrone/mocks';
import { server } from '@mitdrone/mocks/node';
import { configureApiClient, makeQueryClient } from '@mitdrone/sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { afterAll, beforeAll, beforeEach, vi } from 'vitest';

import type { ReactNode } from 'react';

export interface NavState {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  search: string;
}
const globals = globalThis as { __nav?: NavState };
/** Shared with the next/navigation mock through globalThis so the hoisted vi.mock factory can read it lazily. */
export const nav: NavState = (globals.__nav ??= { push: vi.fn(), replace: vi.fn(), search: '' });

export function setupMockApi() {
  beforeAll(() => {
    setMockConfig({ latency: false });
    server.listen({ onUnhandledRequest: 'error' });
    configureApiClient({
      baseUrl: 'http://api.test/api/v1',
      getCsrfToken: () => 'test-csrf-token',
    });
  });
  afterAll(() => server.close());
  beforeEach(() => {
    resetDb();
    localStorage.clear();
    nav.push.mockClear();
    nav.replace.mockClear();
    nav.search = '';
  });
}

/** Signs in first (like a page load with a restored session), then renders the UI. */
export async function renderAs(email: string, ui: ReactNode) {
  const controller = new AuthController({
    storageKey: 'test.admin',
    allowedRoles: ['admin', 'super_admin', 'support'],
    mockMode: true,
  });
  await controller.login({ email, password: 'Password123!' });
  const queryClient = makeQueryClient();
  queryClient.setDefaultOptions({
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  });
  return {
    controller,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider controller={controller}>{ui}</AuthProvider>
      </QueryClientProvider>,
    ),
  };
}
