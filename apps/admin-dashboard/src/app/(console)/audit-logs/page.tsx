import { AuditTable } from '@/components/audit/audit-table';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Audit logs' };

export default function AuditLogsPage() {
  return <AuditTable />;
}
