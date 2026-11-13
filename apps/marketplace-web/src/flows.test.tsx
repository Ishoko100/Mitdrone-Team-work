import { resetDb, setMockConfig } from '@mitdrone/mocks';
import { server } from '@mitdrone/mocks/node';
import { configureApiClient, makeQueryClient } from '@mitdrone/sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CartView } from '@/components/cart/cart-view';
import { MockCardForm } from '@/components/checkout/mock-card-form';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

import type { ReactNode } from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/cart',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
  default: (p: { alt: string; src: string }) => <img alt={p.alt} src={p.src} />,
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...r }: { href: string; children: ReactNode }) => (
    <a href={href} {...r}>
      {children}
    </a>
  ),
}));

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
  useCartStore.setState({ lines: [], hydrated: true });
  useUiStore.setState({ couponCode: '' });
});

const withQuery = (ui: ReactNode) => (
  <QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>
);

describe('MockCardForm', () => {
  it('validates, blocks invalid cards and passes only last4 and brand', async () => {
    const onSubmit = vi.fn();
    render(<MockCardForm onSubmit={onSubmit} busy={false} label="Pay now" />);
    await userEvent.click(screen.getByRole('button', { name: 'Pay now' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /test card \(succeeds\)/i }));
    expect(screen.getByLabelText('Card number')).toHaveValue('4242 4242 4242 4242');
    await userEvent.click(screen.getByRole('button', { name: 'Pay now' }));
    expect(onSubmit).toHaveBeenCalledWith({ last4: '4242', brand: 'visa' });
  });

  it('formats card number and expiry as you type', async () => {
    render(<MockCardForm onSubmit={vi.fn()} busy={false} label="Pay" />);
    await userEvent.type(screen.getByLabelText('Card number'), '5555555555554444');
    expect(screen.getByLabelText('Card number')).toHaveValue('5555 5555 5555 4444');
    await userEvent.type(screen.getByLabelText(/Expiry/), '1230');
    expect(screen.getByLabelText(/Expiry/)).toHaveValue('12/30');
  });
});

describe('CartView with the mock API', () => {
  const line = {
    key: 'x',
    productId: 'prd_029',
    vendorId: 'ven_01',
    title: 'Weatherproof Drone Backpack 25L',
    slug: 'weatherproof-drone-backpack-25l',
    unitPrice: { amount: 18_000_000, currency: 'NGN' as const },
    maxQuantity: 14,
  };

  it('shows server-computed totals including VAT and applies a coupon', async () => {
    useCartStore.setState({
      lines: [{ ...line, key: 'prd_029:base', quantity: 2 }],
      hydrated: true,
    });
    render(withQuery(<CartView />));
    expect(await screen.findByText('Subtotal')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('VAT (7.5%)')).toBeInTheDocument());
    await userEvent.type(screen.getByLabelText('Coupon code'), 'welcome10');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText(/Discount \(WELCOME10\)/)).toBeInTheDocument();
  });

  it('updates quantity and removes lines, ending on the empty state', async () => {
    useCartStore.setState({
      lines: [{ ...line, key: 'prd_029:base', quantity: 1 }],
      hydrated: true,
    });
    render(withQuery(<CartView />));
    await userEvent.click(await screen.findByRole('button', { name: 'Increase quantity' }));
    expect(useCartStore.getState().lines[0]?.quantity).toBe(2);
    await userEvent.click(screen.getByRole('button', { name: /Remove/ }));
    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('surfaces over-stock errors from the API', async () => {
    useCartStore.setState({
      lines: [{ ...line, key: 'prd_029:base', quantity: 1, maxQuantity: 99 }],
      hydrated: true,
    });
    useCartStore.getState().setQuantity('prd_029:base', 40);
    render(withQuery(<CartView />));
    expect(await screen.findByText(/in stock|Only \d+ left/i)).toBeInTheDocument();
  });
});
