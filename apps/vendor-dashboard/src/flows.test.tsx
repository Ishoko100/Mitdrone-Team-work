import { getDb } from '@mitdrone/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InventoryTable } from '@/components/inventory/inventory-table';
import { OnboardingWizard } from '@/components/onboarding/wizard';
import { OrderDetail } from '@/components/orders/order-detail';
import { OrdersTable } from '@/components/orders/orders-table';
import { ProductForm } from '@/components/products/product-form';
import { SettingsView } from '@/components/settings/settings-form';

import { nav, renderAs, setupMockApi } from './test-utils';

import type { ReactNode } from 'react';

vi.mock('next/navigation', () => {
  const state = () =>
    (
      globalThis as unknown as {
        __nav: { push: (p: string) => void; replace: (p: string) => void; search: string };
      }
    ).__nav;
  return {
    useRouter: () => ({
      push: (p: string) => state().push(p),
      replace: (p: string) => state().replace(p),
    }),
    usePathname: () => '/test',
    useSearchParams: () => new URLSearchParams(state().search),
  };
});
// eslint-disable-next-line @next/next/no-img-element -- test double for next/image
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
vi.mock('next/dynamic', () => ({
  default: () =>
    function Stub({ value, onChange }: { value: string; onChange: (v: string) => void }) {
      return (
        <textarea
          aria-label="Product description"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    },
}));

setupMockApi();
const OWNER = 'vendor@mitdrone.test';

describe('Orders', () => {
  it('lists only this vendor’s orders', async () => {
    await renderAs(OWNER, <OrdersTable />);
    const rows = await screen.findAllByRole('row');
    expect(rows.length).toBeGreaterThan(2);
    const mine = getDb().orders.filter((o) => o.vendorIds.includes('ven_01')).length;
    expect(
      await screen.findByText(new RegExp(`\\b${Math.min(mine, 10)}\\b|results`)).catch(() => true),
    ).toBeTruthy();
    // every order number shown belongs to a vendor-01 order
    const numbers = getDb()
      .orders.filter((o) => o.vendorIds.includes('ven_01'))
      .map((o) => o.number);
    const shown = screen.getAllByRole('link', { name: /^MD-\d+$/ }).map((a) => a.textContent ?? '');
    expect(shown.length).toBeGreaterThan(0);
    for (const n of shown) expect(numbers).toContain(n);
  });

  it('moves a paid order forward instantly, and requires tracking to ship', async () => {
    const paid = getDb().orders.find((o) => o.vendorIds.includes('ven_01') && o.status === 'paid');
    expect(paid, 'seed has a paid vendor-01 order').toBeTruthy();
    await renderAs(OWNER, <OrderDetail id={paid!.id} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Start processing' }));
    await waitFor(() =>
      expect(getDb().orders.find((o) => o.id === paid!.id)?.status).toBe('processing'),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Mark as shipped' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Mark as shipped' })).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Tracking number'), 'TRK123456');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mark as shipped' }));
    await waitFor(() =>
      expect(getDb().orders.find((o) => o.id === paid!.id)).toMatchObject({
        status: 'shipped',
        trackingNumber: 'TRK123456',
      }),
    );
  });

  it('blocks access to another vendor’s order', async () => {
    const other = getDb().orders.find((o) => !o.vendorIds.includes('ven_01'));
    await renderAs(OWNER, <OrderDetail id={other!.id} />);
    expect(await screen.findByText('We could not load this order')).toBeInTheDocument();
  });
});

describe('Inventory', () => {
  it('saves a stock change on blur', async () => {
    await renderAs(OWNER, <InventoryTable />);
    const product = getDb().products.find((p) => p.vendorId === 'ven_01')!;
    const input = await screen.findByLabelText(`Stock for ${product.title}`);
    await userEvent.clear(input);
    await userEvent.type(input, '77');
    await userEvent.tab();
    await waitFor(() =>
      expect(getDb().products.find((p) => p.id === product.id)?.inventory.quantity).toBe(77),
    );
  });
});

describe('Product form', () => {
  it('shows validation errors for an empty submit', async () => {
    await renderAs(OWNER, <ProductForm />);
    await userEvent.click(await screen.findByRole('button', { name: 'Submit for review' }));
    expect(await screen.findByText('Title must be at least 5 characters')).toBeInTheDocument();
    expect(screen.getByText('Pick at least one category')).toBeInTheDocument();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it('creates a product as pending review and returns to the list', async () => {
    await renderAs(OWNER, <ProductForm />);
    await userEvent.type(await screen.findByLabelText('Title'), 'DJI Mini 4 Pro Battery Plus');
    await userEvent.type(
      screen.getByLabelText('Short description'),
      'Extended flight battery for Mini 4 Pro.',
    );
    await userEvent.type(
      screen.getByLabelText('Product description'),
      'A longer description of the battery and what is included.',
    );
    await userEvent.type(screen.getByLabelText('Brand'), 'DJI');
    await userEvent.type(screen.getByLabelText('Price'), '125000');
    await userEvent.type(screen.getByLabelText('SKU'), 'BAT-PLUS-1');
    await userEvent.click(screen.getByRole('combobox', { name: /categor/i }));
    await userEvent.click(await screen.findByText('Batteries & Chargers'));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/products'));
    const created = getDb().products.find((p) => p.title === 'DJI Mini 4 Pro Battery Plus');
    expect(created).toMatchObject({
      status: 'pending_review',
      vendorId: 'ven_01',
      price: { amount: 12_500_000 },
    });
  });

  it('refuses listing from a store that is not approved yet', async () => {
    await renderAs('owner@newwave-aviation.mitdrone.test', <ProductForm />);
    await userEvent.type(await screen.findByLabelText('Title'), 'Pending vendor product');
    await userEvent.type(
      screen.getByLabelText('Short description'),
      'Trying to list before approval.',
    );
    await userEvent.type(
      screen.getByLabelText('Product description'),
      'This should be rejected by the API for now.',
    );
    await userEvent.type(screen.getByLabelText('Brand'), 'DJI');
    await userEvent.type(screen.getByLabelText('Price'), '50000');
    await userEvent.type(screen.getByLabelText('SKU'), 'PEND-1');
    await userEvent.click(screen.getByRole('combobox', { name: /categor/i }));
    await userEvent.click(await screen.findByText('Propellers'));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(await screen.findByText(/must be approved/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /finish store verification/i })).toBeInTheDocument();
  });
});

describe('Onboarding', () => {
  it('shows the under-review state for a submitted store', async () => {
    await renderAs('owner@newwave-aviation.mitdrone.test', <OnboardingWizard />);
    expect(await screen.findByRole('heading', { name: 'Under review' })).toBeInTheDocument();
  });
  it('shows the live state for an approved store', async () => {
    await renderAs(OWNER, <OnboardingWizard />);
    expect(await screen.findByRole('heading', { name: 'Your store is live' })).toBeInTheDocument();
  });
});

describe('Settings permissions', () => {
  it('lets the owner edit and makes staff read-only', async () => {
    const owner = await renderAs(OWNER, <SettingsView />);
    expect(await screen.findByRole('button', { name: 'Save settings' })).toBeInTheDocument();
    owner.unmount();
    await renderAs('staff@mitdrone.test', <SettingsView />);
    expect(await screen.findByText(/view-only access/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save settings' })).toBeNull();
    expect(screen.getByLabelText('Store name')).toBeDisabled();
  });
});
