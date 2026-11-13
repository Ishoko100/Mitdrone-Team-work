import { Overview } from '@/components/dashboard/overview';
import { getVendorBackendHealthLive } from '@/lib/backend-data';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const backendHealth = await getVendorBackendHealthLive();
  return <Overview backendHealth={backendHealth} />;
}
