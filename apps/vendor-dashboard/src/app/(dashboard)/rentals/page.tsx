import { RentalsComingSoon } from '@/components/services/rentals-coming-soon';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Rentals' };

export default function RentalsPage() {
  return <RentalsComingSoon />;
}
