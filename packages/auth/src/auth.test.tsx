import { MOCK_PASSWORD } from '@mitdrone/data';
import { resetDb, setMockConfig } from '@mitdrone/mocks';
import { server } from '@mitdrone/mocks/node';
import { configureApiClient } from '@mitdrone/sdk';
import { ADMIN_ROLES, VENDOR_ROLES } from '@mitdrone/types';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthController } from './controller';
import { GuestOnly, RequireAuth, withAdminAuth, withVendorAuth } from './guards';
import { getTokenClaims } from './mock-jwt';
import { AuthProvider } from './provider';
import { can, safeNextPath } from './roles';
import { useAuth } from './use-auth';

import type { ReactNode } from 'react';

const nav = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: nav.replace }) }));

const KEY = 'test.auth';
const BASE = 'http://api.test/api/v1';

beforeAll(() => {
  setMockConfig({ latency: false });
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  resetDb();
  localStorage.clear();
  nav.replace.mockClear();
  setMockConfig({ errorRate: 0 });
  configureApiClient({ baseUrl: BASE });
  window.history.replaceState({}, '', '/dashboard?tab=sales');
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const setup = (options: ConstructorParameters<typeof AuthController>[0] = {}) => {
  const controller = new AuthController({ storageKey: KEY, ...options });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider controller={controller}>{children}</AuthProvider>
  );
  return { controller, wrapper };
};

const creds = (email: string) => ({ email, password: MOCK_PASSWORD });

describe('AuthController / useAuth', () => {
  it('starts unauthenticated when there is no stored session', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
  });

  it('logs in, exposes the user, persists only the refresh token, and logs out', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login(creds('vendor@mitdrone.test'));
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.vendorId).toBe('ven_01');
    expect(result.current.hasRole(VENDOR_ROLES)).toBe(true);
    expect(result.current.can('vendor.bank.edit')).toBe(true);
    expect(localStorage.getItem(`${KEY}.refresh`)).toBeTruthy();
    expect(getTokenClaims(localStorage.getItem(`${KEY}.refresh`))?.type).toBe('refresh');

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.status).toBe('unauthenticated');
    expect(localStorage.getItem(`${KEY}.refresh`)).toBeNull();
  });

  it('rejects the wrong account type for an app and leaves nothing stored', async () => {
    const { wrapper } = setup({ allowedRoles: VENDOR_ROLES });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await expect(result.current.login(creds('ibrahim@mitdrone.test'))).rejects.toMatchObject({
        code: 'wrong_app',
        status: 403,
      });
    });
    expect(result.current.status).toBe('unauthenticated');
    expect(localStorage.getItem(`${KEY}.refresh`)).toBeNull();
  });

  it('shows API errors for bad credentials', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await expect(
        result.current.login({ email: 'ibrahim@mitdrone.test', password: 'wrong-pass1' }),
      ).rejects.toMatchObject({ code: 'invalid_credentials' });
    });
  });

  it('restores the session after a reload using the stored refresh token', async () => {
    const first = setup();
    const a = renderHook(() => useAuth(), { wrapper: first.wrapper });
    await waitFor(() => expect(a.result.current.isLoading).toBe(false));
    await act(async () => {
      await a.result.current.login(creds('admin@mitdrone.test'));
    });
    a.unmount();

    const second = setup(); // fresh controller = fresh page load, access token gone from memory
    const b = renderHook(() => useAuth(), { wrapper: second.wrapper });
    expect(b.result.current.status).toBe('loading');
    await waitFor(() => expect(b.result.current.isAuthenticated).toBe(true));
    expect(b.result.current.user?.email).toBe('admin@mitdrone.test');
  });

  it('ends the session if the stored refresh token is rejected', async () => {
    localStorage.setItem(`${KEY}.refresh`, 'not-a-token');
    const { wrapper } = setup();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(localStorage.getItem(`${KEY}.refresh`)).toBeNull();
  });

  it('logs out in this tab when another tab clears the session', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login(creds('ibrahim@mitdrone.test'));
    });
    act(() => {
      localStorage.removeItem(`${KEY}.refresh`);
      window.dispatchEvent(new StorageEvent('storage', { key: `${KEY}.refresh`, newValue: null }));
    });
    expect(result.current.status).toBe('unauthenticated');
  });

  it('registers a vendor owner who is pending until approved', async () => {
    const { wrapper } = setup({ allowedRoles: VENDOR_ROLES });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.register({
        name: 'Tola Bakare',
        email: 'tola@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        accountType: 'vendor',
      });
    });
    expect(result.current.user).toMatchObject({ role: 'vendor_owner', status: 'pending' });
    expect(result.current.user?.vendorId).toBeTruthy();
  });
});

describe('guards', () => {
  const Secret = () => <p>secret</p>;

  /** Signs in first (like a page load with a restored session), then renders the guarded UI. */
  async function mount(
    ui: ReactNode,
    email?: string,
    options: ConstructorParameters<typeof AuthController>[0] = {},
  ) {
    const { controller, wrapper: Wrapper } = setup(options);
    if (email) await controller.login(creds(email));
    return render(<Wrapper>{ui}</Wrapper>);
  }

  it('redirects anonymous users to login and remembers where they were going', async () => {
    mount(
      <RequireAuth>
        <Secret />
      </RequireAuth>,
    );
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith('/login?next=%2Fdashboard%3Ftab%3Dsales'),
    );
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('renders children for an allowed role', async () => {
    await mount(
      <RequireAuth roles={VENDOR_ROLES}>
        <Secret />
      </RequireAuth>,
      'staff@mitdrone.test',
    );
    expect(await screen.findByText('secret')).toBeInTheDocument();
  });

  it('shows Forbidden (not a redirect) for the wrong role', async () => {
    await mount(
      <RequireAuth roles={ADMIN_ROLES}>
        <Secret />
      </RequireAuth>,
      'vendor@mitdrone.test',
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
    expect(screen.queryByText('secret')).toBeNull();
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it('withVendorAuth and withAdminAuth wrap components', async () => {
    const Vendor = withVendorAuth(Secret);
    const Admin = withAdminAuth(Secret);
    await mount(
      <>
        <Vendor />
        <Admin />
      </>,
      'support@mitdrone.test',
    );
    await waitFor(() => expect(screen.getAllByText('secret')).toHaveLength(1)); // support is admin-side only
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('GuestOnly sends signed-in users to a safe ?next target', async () => {
    window.history.replaceState({}, '', '/login?next=%2Forders');
    await mount(
      <GuestOnly>
        <p>login form</p>
      </GuestOnly>,
      'vendor@mitdrone.test',
    );
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/orders'));
  });
});

describe('roles', () => {
  it('maps permissions to roles', () => {
    expect(can('super_admin', 'admin.roles.edit')).toBe(true);
    expect(can('admin', 'admin.roles.edit')).toBe(false);
    expect(can('support', 'admin.write')).toBe(false);
    expect(can('support', 'admin.disputes.handle')).toBe(true);
    expect(can('vendor_staff', 'vendor.bank.edit')).toBe(false);
    expect(can(undefined, 'admin.read')).toBe(false);
  });
  it('blocks open redirects', () => {
    expect(safeNextPath('/orders?x=1')).toBe('/orders?x=1');
    expect(safeNextPath('//evil.com')).toBe('/');
    expect(safeNextPath('https://evil.com')).toBe('/');
    expect(safeNextPath('/\\evil.com', '/home')).toBe('/home');
    expect(safeNextPath(null, '/home')).toBe('/home');
  });
});
