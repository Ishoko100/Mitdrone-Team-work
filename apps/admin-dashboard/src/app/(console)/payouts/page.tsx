import { PayoutsTable } from '@/components/payouts/payouts-table';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payouts' };

export default function PayoutsPage() {
  return <PayoutsTable />;
}
