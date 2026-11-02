import { ServicesView } from '@/components/services/services-view';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Services' };

export default function ServicesPage() {
  return <ServicesView />;
}
