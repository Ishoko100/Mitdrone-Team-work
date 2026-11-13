import { MOCK_PASSWORD } from '@mitdrone/data';
import { resetDb, setMockConfig } from '@mitdrone/mocks';
import { server } from '@mitdrone/mocks/node';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAddresses, useDeleteAddress, useInfiniteProducts, useProducts } from './hooks/public';
import {
  formatCardNumber,
  isMockStripeKey,
  luhnValid,
  toPaymentMethod,
  validateCard,
} from './payments-mock';

import {
  api,
  configureApiClient,
  getErrorMessage,
  getFieldErrors,
  isApiError,
  makeQueryClient,
} from './index';

import type { ReactNode } from 'react';

const BASE = 'http://api.test/api/v1';
let testFetch: typeof fetch;

beforeAll(() => {
  setMockConfig({ latency: false });
  server.listen({ onUnhandledRequest: 'error' });
  const interceptedFetch = globalThis.fetch.bind(globalThis);
  // jsdom's AbortSignal is a different realm from Node/undici's, which MSW uses here.
  // Cancellation is covered by the browser integration; unit hook requests omit this signal.
  testFetch = (input, init) => interceptedFetch(input, { ...init, signal: undefined });
});
beforeEach(() => {
  resetDb();
  setMockConfig({ errorRate: 0 });
  configureApiClient({
    baseUrl: BASE,
    getAccessToken: undefined,
    getCsrfToken: () => 'test-csrf-token',
    onAuthFailure: undefined,
    onError: undefined,
    fetch: testFetch,
  });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const wrapper = () => {
  const client = makeQueryClient();
  client.setDefaultOptions({
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

async function loginAs(email: string) {
  const { tokens, user } = (await api.auth.login({
    email,
    password: MOCK_PASSWORD,
  })) as { tokens: { accessToken: string }; user: { id: string } };
  configureApiClient({ getAccessToken: () => tokens.accessToken });
  return { tokens, user };
}

describe('client', () => {
  it('returns typed data and serialises query params', async () => {
    const page = await api.catalog.products({ kind: 'drone', pageSize: 3, sort: 'price_desc' });
    expect(page.data).toHaveLength(3);
    expect(page.data[0]!.price.amount).toBeGreaterThanOrEqual(page.data[1]!.price.amount);
  });

  it('maps API errors to ApiClientError with field errors', async () => {
    const onError = vi.fn();
    configureApiClient({ onError });
    const error = await api.auth
      .register({
        email: 'ibrahim@mitdrone.test',
        fullName: 'Ibrahim Musa',
        phone: '08031234567',
        acceptedTerms: true,
        termsVersion: 'v1',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      })
      .catch((e: unknown) => e);
    expect(isApiError(error)).toBe(true);
    if (isApiError(error)) {
      expect(error.status).toBe(409);
      expect(error.code).toBe('email_taken');
    }
    expect(getFieldErrors(error)).toEqual({ email: 'Email already in use' });
    expect(getErrorMessage(error)).toMatch(/already exists/);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('wraps network failures', async () => {
    configureApiClient({ fetch: () => Promise.reject(new TypeError('boom')) });
    const error = await api.catalog.categories().catch((e: unknown) => e);
    expect(isApiError(error) && error.status === 0 && error.code === 'network_error').toBe(true);
    configureApiClient({ fetch: undefined });
  });

  it('attaches the bearer token', async () => {
    await expect(api.me.orders()).rejects.toMatchObject({ status: 401 });
    await loginAs('ibrahim@mitdrone.test');
    const orders = await api.me.orders({ pageSize: 5 });
    expect(orders.data.length).toBeGreaterThan(0);
  });

  it('calls onAuthFailure when the cookie session has expired', async () => {
    const onAuthFailure = vi.fn();
    configureApiClient({
      getAccessToken: undefined,
      onAuthFailure,
    });
    await expect(api.me.orders()).rejects.toMatchObject({ status: 401 });
    expect(onAuthFailure).toHaveBeenCalledOnce();
  });

  it('includes cookies and a CSRF header on authenticated mutations', async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.credentials).toBe('include');
      expect(new Headers(init?.headers).get('x-csrf-token')).toBe('test-csrf-token');
      return Response.json({ id: 'address-1' });
    });
    configureApiClient({ fetch });
    await api.me.addAddress({
      fullName: 'Ibrahim Musa',
      phone: '08031234567',
      line1: '12 Zaria Road',
      city: 'Zaria',
      state: 'Kaduna',
      country: 'NG',
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('fails closed when no CSRF token is configured', async () => {
    configureApiClient({ getCsrfToken: undefined });
    await expect(
      api.me.addAddress({
        fullName: 'Ibrahim Musa',
        phone: '08031234567',
        line1: '12 Zaria Road',
        city: 'Zaria',
        state: 'Kaduna',
        country: 'NG',
      }),
    ).rejects.toMatchObject({ code: 'csrf_token_unavailable' });
  });
});

describe('hooks', () => {
  it('useProducts loads a page', async () => {
    const { result } = renderHook(() => useProducts({ pageSize: 4 }), { wrapper: wrapper() });
    await waitFor(() => {
      if (result.current.isError) throw result.current.error;
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.data).toHaveLength(4);
  });

  it('useInfiniteProducts pages forward', async () => {
    // Read `data` during render (as a component would) so TanStack tracks it.
    const { result } = renderHook(
      () => {
        const query = useInfiniteProducts({ pageSize: 10 });
        return { query, pages: query.data?.pages.length ?? 0, hasNext: query.hasNextPage };
      },
      { wrapper: wrapper() },
    );
    await waitFor(() => {
      if (result.current.query.isError) throw result.current.query.error;
      expect(result.current.pages).toBe(1);
    });
    expect(result.current.hasNext).toBe(true);
    await act(async () => {
      await result.current.query.fetchNextPage();
    });
    await waitFor(() => expect(result.current.pages).toBe(2));
  });

  it('optimistic delete rolls back when the request fails', async () => {
    await loginAs('ibrahim@mitdrone.test');
    const { result } = renderHook(() => ({ list: useAddresses(), del: useDeleteAddress() }), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    const before = result.current.list.data!;
    expect(before.length).toBe(1);

    setMockConfig({ errorRate: 1 });
    await act(async () => {
      await result.current.del.mutateAsync(before[0]!.id).catch(() => undefined);
    });
    expect(result.current.list.data).toHaveLength(1);

    setMockConfig({ errorRate: 0 });
    await act(async () => {
      await result.current.del.mutateAsync(before[0]!.id);
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(0));
  });
});

describe('payments mock', () => {
  it('validates cards like Stripe test cards', () => {
    expect(luhnValid('4242 4242 4242 4242')).toBe(true);
    expect(luhnValid('4242 4242 4242 4241')).toBe(false);
    const ok = validateCard({ number: '4242 4242 4242 4242', expiry: '12/40', cvc: '123' });
    expect(ok).toMatchObject({ valid: true, brand: 'visa', last4: '4242' });
    expect(validateCard({ number: '4242', expiry: '01/20', cvc: '1' }).errors).toMatchObject({
      number: expect.any(String),
      expiry: expect.any(String),
      cvc: expect.any(String),
    });
    expect(validateCard({ number: '3782 822463 10005', expiry: '12/40', cvc: '1234' }).brand).toBe(
      'amex',
    );
  });
  it('formats numbers, derives the payment method and detects mock keys', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(toPaymentMethod({ number: '4000 0000 0000 0002' })).toEqual({
      last4: '0002',
      brand: 'visa',
    });
    expect(isMockStripeKey('pk_test_mitdrone_mock')).toBe(true);
    expect(isMockStripeKey('pk_test_51Abc')).toBe(false);
  });
});
