import { getDb } from '@mitdrone/mocks';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditTable } from '@/components/audit/audit-table';
import { DisputeDetail } from '@/components/disputes/dispute-detail';
import { OrderDetail } from '@/components/orders/order-detail';
import { PayoutsTable } from '@/components/payouts/payouts-table';
import { ProductsTable } from '@/components/products/products-table';
import { SettingsView } from '@/components/settings/settings-form';
import { UsersTable } from '@/components/users/users-table';
import { VendorDetail } from '@/components/vendors/vendor-detail';
import { VendorsTable } from '@/components/vendors/vendors-table';

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

setupMockApi();
const SUPER = 'superadmin@mitdrone.test';
const ADMIN = 'admin@mitdrone.test';
const SUPPORT = 'support@mitdrone.test';
const lastAudit = () => getDb().auditLogs[0];

async function openRowMenu(name: string) {
  await userEvent.click(await screen.findByRole('button', { name: `Actions for ${name}` }));
}

describe('Vendors', () => {
  beforeEach(() => {
    nav.search = 'status=pending_review';
  });

  it('approves a pending vendor and writes an audit entry', async () => {
    await renderAs(ADMIN, <VendorsTable />);
    await openRowMenu('NewWave Aviation');
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Approve' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Approve vendor' }));
    await waitFor(() =>
      expect(getDb().vendors.find((v) => v.name === 'NewWave Aviation')?.status).toBe('approved'),
    );
    expect(lastAudit()).toMatchObject({ action: 'vendor.approve', actorRole: 'admin' });
  });

  it('requires a reason to reject, then records it', async () => {
    await renderAs(ADMIN, <VendorsTable />);
    await openRowMenu('NewWave Aviation');
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject vendor' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/enter a reason/i);
    expect(getDb().vendors.find((v) => v.name === 'NewWave Aviation')?.status).toBe(
      'pending_review',
    );
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'CAC document is unreadable');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject vendor' }));
    await waitFor(() =>
      expect(getDb().vendors.find((v) => v.name === 'NewWave Aviation')?.status).toBe('rejected'),
    );
    expect(lastAudit()).toMatchObject({
      action: 'vendor.reject',
      metadata: { reason: 'CAC document is unreadable' },
    });
  });

  it('gives support staff read-only access', async () => {
    await renderAs(SUPPORT, <VendorsTable />);
    expect(await screen.findByText('NewWave Aviation')).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0); // no bulk selection
    await openRowMenu('NewWave Aviation');
    expect(await screen.findByRole('menuitem', { name: 'View details' })).toBeInTheDocument();
    for (const name of ['Approve', 'Reject', 'Suspend'])
      expect(screen.queryByRole('menuitem', { name })).toBeNull();
  });

  it('shows the KYC review with documents on the vendor page', async () => {
    await renderAs(ADMIN, <VendorDetail id="ven_10" />);
    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(await screen.findByText('CAC certificate')).toBeInTheDocument();
    expect(screen.getByText(/NewWave Aviation Limited/)).toBeInTheDocument();
  });
});

describe('Product moderation', () => {
  it('flags with a reason and approves a pending product', async () => {
    nav.search = 'status=pending_review';
    await renderAs(ADMIN, <ProductsTable />);
    const pending = getDb().products.find((p) => p.status === 'pending_review')!;
    await userEvent.click(await screen.findByRole('button', { name: `Moderate ${pending.title}` }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Flag' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Photos look copied');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Flag product' }));
    await waitFor(() =>
      expect(getDb().products.find((p) => p.id === pending.id)).toMatchObject({
        status: 'flagged',
        moderationNote: 'Photos look copied',
      }),
    );
    expect(lastAudit()).toMatchObject({ action: 'product.flag', entityId: pending.id });
  });

  it('approves a flagged product', async () => {
    nav.search = 'status=flagged';
    await renderAs(ADMIN, <ProductsTable />);
    const flagged = getDb().products.find((p) => p.status === 'flagged')!;
    await userEvent.click(await screen.findByRole('button', { name: `Moderate ${flagged.title}` }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Approve' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }));
    await waitFor(() =>
      expect(getDb().products.find((p) => p.id === flagged.id)?.status).toBe('active'),
    );
    expect(lastAudit()).toMatchObject({ action: 'product.approve' });
  });
});

describe('Refunds and disputes', () => {
  it('refunds an order with a reason', async () => {
    const order = getDb().orders.find((o) => o.status === 'delivered')!;
    await renderAs(ADMIN, <OrderDetail id={order.id} />);
    await userEvent.click(await screen.findByRole('button', { name: /refund order/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Customer returned the item');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refund order' }));
    await waitFor(() =>
      expect(getDb().orders.find((o) => o.id === order.id)?.status).toBe('refunded'),
    );
    expect(getDb().payments.find((p) => p.id === order.paymentId)?.status).toBe('refunded');
    expect(lastAudit()).toMatchObject({ action: 'order.refund', entityId: order.id });
  });

  it('hides refund from support staff', async () => {
    const order = getDb().orders.find((o) => o.status === 'delivered')!;
    await renderAs(SUPPORT, <OrderDetail id={order.id} />);
    expect(await screen.findByText(`Order ${order.number}`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /refund order/i })).toBeNull();
  });

  it('lets support assign and reply but not resolve', async () => {
    const dispute = getDb().disputes.find((d) => d.status === 'open')!;
    await renderAs(SUPPORT, <DisputeDetail id={dispute.id} />);
    expect(screen.queryByRole('button', { name: /resolve/i })).toBeNull();
    await userEvent.click(await screen.findByRole('button', { name: /assign to me/i }));
    await waitFor(() =>
      expect(getDb().disputes.find((d) => d.id === dispute.id)?.assignedTo).toBe('usr_adm_03'),
    );
    await userEvent.type(
      screen.getByLabelText('Reply to the customer and seller'),
      'We are reviewing your photos.',
    );
    await userEvent.click(screen.getByRole('button', { name: /send message/i }));
    await waitFor(() =>
      expect(
        getDb()
          .disputes.find((d) => d.id === dispute.id)
          ?.messages.at(-1)?.body,
      ).toBe('We are reviewing your photos.'),
    );
  });

  it('resolves a dispute with a refund, which refunds the order', async () => {
    const dispute = getDb().disputes.find((d) => d.status === 'open')!;
    await renderAs(ADMIN, <DisputeDetail id={dispute.id} />);
    await userEvent.click(await screen.findByRole('button', { name: /^resolve$/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /refund and resolve/i }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/resolution note/i);
    await userEvent.type(
      within(dialog).getByLabelText('Resolution note'),
      'Item was not as described',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: /refund and resolve/i }));
    await waitFor(() =>
      expect(getDb().disputes.find((d) => d.id === dispute.id)?.status).toBe('resolved_refund'),
    );
    expect(getDb().orders.find((o) => o.id === dispute.orderId)?.status).toBe('refunded');
    expect(
      getDb()
        .auditLogs.slice(0, 3)
        .map((a) => a.action),
    ).toContain('dispute.resolve');
  });
});

describe('Payouts', () => {
  it('processes a pending payout', async () => {
    nav.search = 'status=pending';
    await renderAs(ADMIN, <PayoutsTable />);
    const payout = getDb().payouts.find((p) => p.status === 'pending')!;
    await userEvent.click(
      await screen.findByRole('button', { name: `Actions for payout ${payout.id}` }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: /process payout/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Process' }));
    await waitFor(() =>
      expect(getDb().payouts.find((p) => p.id === payout.id)).toMatchObject({
        status: 'paid',
        processedBy: 'usr_adm_02',
      }),
    );
    expect(lastAudit()).toMatchObject({ action: 'payout.process', entityId: payout.id });
  });

  it('puts a payout on hold with a reason', async () => {
    nav.search = 'status=pending';
    await renderAs(ADMIN, <PayoutsTable />);
    const payout = getDb().payouts.find((p) => p.status === 'pending')!;
    await userEvent.click(
      await screen.findByRole('button', { name: `Actions for payout ${payout.id}` }),
    );
    await userEvent.click(await screen.findByRole('menuitem', { name: /put on hold/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Bank details mismatch');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Put on hold' }));
    await waitFor(() =>
      expect(getDb().payouts.find((p) => p.id === payout.id)?.status).toBe('on_hold'),
    );
  });
});

describe('Users and roles', () => {
  it('lets only a super admin change roles', async () => {
    nav.search = 'q=Grace';
    const owner = await renderAs(ADMIN, <UsersTable />);
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Grace Ojo' }));
    expect(screen.queryByRole('menuitem', { name: /change role/i })).toBeNull();
    expect(screen.getByRole('menuitem', { name: /suspend account/i })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    owner.unmount();

    await renderAs(SUPER, <UsersTable />);
    await userEvent.click(await screen.findByRole('button', { name: 'Actions for Grace Ojo' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /change role/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Admin' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Change role' }));
    await waitFor(() =>
      expect(getDb().users.find((u) => u.name === 'Grace Ojo')?.role).toBe('admin'),
    );
    expect(lastAudit()).toMatchObject({ action: 'user.update_role', actorRole: 'super_admin' });
  });

  it('never offers actions on your own account', async () => {
    nav.search = 'q=Adaeze';
    await renderAs(SUPER, <UsersTable />);
    expect(await screen.findByText('Adaeze Okoro')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for Adaeze Okoro' })).toBeNull();
  });

  it('adds a team member as a super admin', async () => {
    await renderAs(SUPER, <UsersTable />);
    await userEvent.click(await screen.findByRole('button', { name: /add team member/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Full name'), 'Femi Adeoye');
    await userEvent.type(within(dialog).getByLabelText('Email'), 'femi@mitdrone.test');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add member' }));
    await waitFor(() =>
      expect(getDb().users.find((u) => u.email === 'femi@mitdrone.test')).toMatchObject({
        role: 'support',
      }),
    );
  });
});

describe('Platform settings', () => {
  it('lets a super admin change the commission, audited, and validates ranges', async () => {
    await renderAs(SUPER, <SettingsView />);
    const field = await screen.findByLabelText('Default commission (%)');
    await userEvent.clear(field);
    await userEvent.type(field, '60');
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Maximum 50%')).toBeInTheDocument();
    expect(getDb().settings.defaultCommissionRate).toBe(0.08);
    await userEvent.clear(field);
    await userEvent.type(field, '9');
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() => expect(getDb().settings.defaultCommissionRate).toBeCloseTo(0.09));
    expect(lastAudit()).toMatchObject({ action: 'settings.update', actorRole: 'super_admin' });
  });

  it('is read-only for admins', async () => {
    await renderAs(ADMIN, <SettingsView />);
    expect(await screen.findByText(/only a super admin can change/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Default commission (%)')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save settings' })).toBeNull();
  });
});

describe('Audit log', () => {
  it('lists entries and filters them from the URL', async () => {
    nav.search = 'action=vendor.suspend';
    await renderAs(ADMIN, <AuditTable />);
    expect(await screen.findByText(/Suspended QuickFly Traders/)).toBeInTheDocument();
    expect(screen.queryByText(/Approved vendor Used Drone Exchange/)).toBeNull();
  });

  it('records an export as an audit entry', async () => {
    const createUrl = vi.fn(() => 'blob:test');
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await renderAs(ADMIN, <AuditTable />);
    await userEvent.click(await screen.findByRole('button', { name: /export/i }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /csv/i }));
    await waitFor(() =>
      expect(lastAudit()).toMatchObject({ action: 'export.create', entityId: 'audit-logs' }),
    );
    expect(createUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });
});
