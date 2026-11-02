import { AuthController, AuthProvider } from '@mitdrone/auth';
import { getDb } from '@mitdrone/mocks';
import { api, configureApiClient, makeQueryClient } from '@mitdrone/sdk';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { OnboardingWizard } from '@/components/onboarding/wizard';

import { setupMockApi } from './test-utils';

import type { ReactNode } from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/onboarding',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...r }: { href: string; children: ReactNode }) => (
    <a href={href} {...r}>
      {children}
    </a>
  ),
}));

setupMockApi();

async function pick(label: RegExp | string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

describe('seller journey', () => {
  it('registers, completes onboarding, is approved by an admin, then can list a product', async () => {
    const controller = new AuthController({
      storageKey: 'journey',
      allowedRoles: ['vendor_owner', 'vendor_staff'],
    });
    await controller.register({
      name: 'Tola Bakare',
      email: 'tola@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      accountType: 'vendor',
    });
    const vendorId = controller.getSnapshot().user!.vendorId!;
    expect(getDb().vendors.find((v) => v.id === vendorId)?.status).toBe('draft');

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <AuthProvider controller={controller}>
          <OnboardingWizard />
        </AuthProvider>
      </QueryClientProvider>,
    );

    // Step 1: store profile
    await userEvent.clear(await screen.findByLabelText('Store name'));
    await userEvent.type(screen.getByLabelText('Store name'), 'Bakare Aerial Works');
    await userEvent.type(
      screen.getByLabelText('About your store'),
      'Drone dealer and repair shop serving Ibadan and Oyo state.',
    );
    await userEvent.type(screen.getByLabelText('Business phone'), '08031234567');
    await userEvent.type(screen.getByLabelText('City'), 'Ibadan');
    await pick(/state/i, 'Oyo');
    await userEvent.type(
      screen.getByLabelText('Return policy'),
      'Returns accepted within 7 days in original packaging.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    // Step 2: documents (required ones first)
    await userEvent.type(
      await screen.findByLabelText('Registered business name'),
      'Bakare Aerial Works Limited',
    );
    await userEvent.upload(
      screen.getByLabelText('Upload CAC certificate'),
      new File(['x'], 'cac.pdf', { type: 'application/pdf' }),
    );
    await waitFor(() =>
      expect(getDb().kyc.find((k) => k.vendorId === vendorId)?.documents).toHaveLength(1),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(await screen.findByText('Upload the required documents first.')).toBeInTheDocument();
    await userEvent.upload(
      screen.getByLabelText('Upload Director or owner ID'),
      new File(['x'], 'id.png', { type: 'image/png' }),
    );
    await waitFor(() =>
      expect(getDb().kyc.find((k) => k.vendorId === vendorId)?.documents).toHaveLength(2),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    // Step 3: payout details (validation first)
    await userEvent.type(
      await screen.findByLabelText('Account name'),
      'Bakare Aerial Works Limited',
    );
    await userEvent.type(screen.getByLabelText('Account number'), '12345');
    await pick(/bank/i, 'GTBank');
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(await screen.findByText('Account number must be 10 digits')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Account number'));
    await userEvent.type(screen.getByLabelText('Account number'), '0123456789');
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }));

    // Step 4: review and submit
    const submit = await screen.findByRole('button', { name: 'Submit for review' });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.click(submit);
    await waitFor(() =>
      expect(getDb().vendors.find((v) => v.id === vendorId)?.status).toBe('pending_review'),
    );
    expect(await screen.findByRole('heading', { name: 'Under review' })).toBeInTheDocument();

    // Listing is blocked until an admin approves...
    const form = {
      title: 'DJI Mini 4 Pro Spare Props',
      shortDescription: 'Spare propellers for Mini 4 Pro.',
      description: 'A pair of spare low-noise propellers for the Mini 4 Pro.',
      kind: 'accessory',
      listingType: 'sale',
      condition: 'new',
      brand: 'DJI',
      categoryIds: ['cat_propellers'],
      priceMajor: 15000,
      sku: 'PROP-1',
      quantity: 10,
      lowStockThreshold: 2,
      tags: [],
    } as const;
    await expect(api.seller.createProduct(vendorId, form as never)).rejects.toMatchObject({
      code: 'vendor_not_approved',
    });

    // ...then an admin approves, which is audited, and listing works.
    configureApiClient({ getAccessToken: undefined });
    const admin = await api.auth.login({ email: 'admin@mitdrone.test', password: 'Password123!' });
    configureApiClient({ getAccessToken: () => admin.tokens.accessToken });
    await api.admin.approveVendor(vendorId);
    expect(getDb().auditLogs[0]).toMatchObject({ action: 'vendor.approve', entityId: vendorId });

    const seller = await api.auth.login({ email: 'tola@example.com', password: 'Password123!' });
    configureApiClient({ getAccessToken: () => seller.tokens.accessToken });
    const product = await api.seller.createProduct(vendorId, form as never);
    expect(product).toMatchObject({ status: 'pending_review', vendorId });
    // Long end-to-end journey (about 25 UI interactions): give it a budget that survives a loaded CI machine.
  }, 90_000);
});
