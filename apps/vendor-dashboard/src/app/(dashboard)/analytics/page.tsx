import { AnalyticsView } from '@/components/analytics/analytics-view';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
