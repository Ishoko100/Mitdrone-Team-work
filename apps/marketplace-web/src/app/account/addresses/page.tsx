import { AddressesView } from '@/components/account/addresses-view';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Addresses' };

export default function AddressesPage() {
  return <AddressesView />;
}
