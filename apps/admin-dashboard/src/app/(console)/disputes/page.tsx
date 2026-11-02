import { DisputesTable } from '@/components/disputes/disputes-table';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Disputes' };

export default function DisputesPage() {
  return <DisputesTable />;
}
