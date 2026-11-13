import { configureApiClient } from '@mitdrone/sdk';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthController } from './controller';
import { GuestOnly, RequireAuth } from './guards';
import { AuthProvider } from './provider';
import { safeNextPath } from './roles';
import { useAuth } from './use-auth';

import type { Role, User } from '@mitdrone/types';
import type { ReactNode } from 'react';

const nav = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: nav.replace }) }));

const customer: User = {
  id: 'user-test',
  email: 'buyer@example.test',
  name: 'Test Buyer',
  role: 'customer',
  status: 'active',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

let authenticated = false;
beforeEach(() => {
  authenticated = false;
  nav.replace.mockClear();
  configureApiClient({
    baseUrl: 'http://api.test/api/v1',
    getCsrfToken: () => 'test-csrf-token',
    onAuthFailure: undefined,
    fetch: async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith('/auth/login')) {
        authenticated = true;
        return new Response(null, { status: 204 });
      }
      if (path.endsWith('/auth/logout')) {
        authenticated = false;
        return new Response(null, { status: 204 });
      }
      if (path.endsWith('/auth/session')) {
        if (authenticated) return Response.json({ user: customer });
        return Response.json(
          { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
          { status: 401 },
        );
      }
      return Response.json({}, { status: 200 });
    },
  });
  window.history.replaceState({}, '', '/dashboard?tab=sales');
});

const setup = (allowedRoles?: readonly Role[]) => {
  const controller = new AuthController({ allowedRoles });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider controller={controller}>{children}</AuthProvider>
  );
  return { controller, wrapper };
};

describe('cookie-backed AuthController', () => {
  it('restores as unauthenticated when the session endpoint returns 401', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
  });

  it('establishes local state after login and clears it after backend logout', async () => {
    const { wrapper } = setup(['customer']);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await result.current.login({ email: customer.email, password: 'a-valid-password' });
    });
    expect(result.current.user?.id).toBe(customer.id);
    await act(async () => result.current.logout());
    expect(result.current.status).toBe('unauthenticated');
  });

  it('rejects a user whose role is not permitted in this app', async () => {
    const { wrapper } = setup(['vendor_owner']);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await expect(
        result.current.login({ email: customer.email, password: 'a-valid-password' }),
      ).rejects.toMatchObject({ code: 'wrong_app', status: 403 });
    });
  });
});

describe('guards', () => {
  it('redirects anonymous users to login and remembers their location', async () => {
    const controller = new AuthController();
    render(
      <AuthProvider controller={controller}>
        <RequireAuth>
          <p>secret</p>
        </RequireAuth>
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/login?next=%2Fdashboard%3Ftab%3Dsales'),
    );
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('redirects guests with a safe next path after login', async () => {
    window.history.replaceState({}, '', '/login?next=%2Forders');
    const controller = new AuthController();
    await controller.login({ email: customer.email, password: 'a-valid-password' });
    render(
      <AuthProvider controller={controller}>
        <GuestOnly>
          <p>login form</p>
        </GuestOnly>
      </AuthProvider>,
    );
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/orders'));
  });
});

describe('safeNextPath', () => {
  it('blocks external redirects', () => {
    expect(safeNextPath('/orders?x=1')).toBe('/orders?x=1');
    expect(safeNextPath('//evil.test')).toBe('/');
    expect(safeNextPath('https://evil.test')).toBe('/');
    expect(safeNextPath('/\\evil.test', '/home')).toBe('/home');
  });
});
