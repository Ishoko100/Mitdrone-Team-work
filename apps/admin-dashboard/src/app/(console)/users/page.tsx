import { UsersTable } from '@/components/users/users-table';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users & roles' };

export default function UsersPage() {
  return <UsersTable />;
}
