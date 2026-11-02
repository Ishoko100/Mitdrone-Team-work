import { ReferralsView } from '@/components/account/referrals-view';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Referrals' };

export default function ReferralsPage() {
  return <ReferralsView />;
}
