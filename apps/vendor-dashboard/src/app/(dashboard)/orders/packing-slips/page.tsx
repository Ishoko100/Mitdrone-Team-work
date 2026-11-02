import { PackingSlips } from '@/components/orders/packing-slips';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Packing slips' };

export default function PackingSlipsPage() {
  return <PackingSlips />;
}
