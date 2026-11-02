import { DisputeDetail } from '@/components/disputes/dispute-detail';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dispute' };

export default async function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  return <DisputeDetail id={(await params).id} />;
}
