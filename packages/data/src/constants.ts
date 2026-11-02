import type { Role } from '@mitdrone/types';

/** Every seeded account accepts this password in the mock auth handlers. */
export const MOCK_PASSWORD = 'Password123!';

export interface DemoAccount {
  label: string;
  email: string;
  role: Role;
  note: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    label: 'Customer (Ibrahim, Zaria)',
    email: 'ibrahim@mitdrone.test',
    role: 'customer',
    note: 'Has orders, a referral dashboard and an open farm-mapping project.',
  },
  {
    label: 'Vendor owner (SkyNaija Drones)',
    email: 'vendor@mitdrone.test',
    role: 'vendor_owner',
    note: 'Approved dealer with products, orders and payouts.',
  },
  {
    label: 'Vendor staff (SkyNaija Drones)',
    email: 'staff@mitdrone.test',
    role: 'vendor_staff',
    note: 'Same vendor scope, no bank or settings changes.',
  },
  {
    label: 'Vendor owner (NewWave Aviation)',
    email: 'owner@newwave-aviation.mitdrone.test',
    role: 'vendor_owner',
    note: 'Pending approval. Use it to test onboarding and the admin approval flow.',
  },
  {
    label: 'Super admin',
    email: 'superadmin@mitdrone.test',
    role: 'super_admin',
    note: 'Full access including roles and platform settings.',
  },
  {
    label: 'Admin',
    email: 'admin@mitdrone.test',
    role: 'admin',
    note: 'Vendors, products, orders, payouts.',
  },
  {
    label: 'Support agent',
    email: 'support@mitdrone.test',
    role: 'support',
    note: 'Read access plus disputes.',
  },
];

export { SELLING_STEPS } from '@mitdrone/utils';

export const COUPONS: Record<string, { percent: number; description: string }> = {
  WELCOME10: { percent: 10, description: '10% off your first order' },
};
