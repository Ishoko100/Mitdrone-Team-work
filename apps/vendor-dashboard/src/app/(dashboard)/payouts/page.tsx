import { PayoutsView } from '@/components/payouts/payouts-view';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payouts' };

export default function PayoutsPage() {
  return <PayoutsView />;
}
