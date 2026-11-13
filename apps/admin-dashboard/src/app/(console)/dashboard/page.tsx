import { Overview } from '@/components/dashboard/overview';
import { getAdminBackendHealthLive } from '@/lib/backend-data';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const backendHealth = await getAdminBackendHealthLive();
  return <Overview backendHealth={backendHealth} />;
}
