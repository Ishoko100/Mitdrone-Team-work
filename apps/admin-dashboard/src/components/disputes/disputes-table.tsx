'use client';

import { getErrorMessage, useAdminDisputes } from '@mitdrone/sdk';
import {
  DataTable,
  DataTableColumnHeader,
  ErrorState,
  PageHeader,
  StatusBadge,
} from '@mitdrone/ui';
import { formatDate, formatMoney } from '@mitdrone/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FilterBar } from '@/components/common/filter-bar';
import { useUrlState } from '@/lib/url';

import type { Dispute, DisputeStatus } from '@mitdrone/types';
import type { ColumnDef } from '@tanstack/react-table';

const STATUSES: [DisputeStatus, string][] = [
  ['open', 'Open'],
  ['under_review', 'Under review'],
  ['resolved_refund', 'Resolved: refunded'],
  ['resolved_no_refund', 'Resolved: no refund'],
  ['closed', 'Closed'],
];

const columns: ColumnDef<Dispute>[] = [
  {
    accessorKey: 'id',
    header: 'Dispute',
    cell: ({ row }) => (
      <Link
        href={`/disputes/${row.original.id}`}
        className="font-mono text-xs font-medium hover:underline"
      >
        {row.original.id}
      </Link>
    ),
  },
  {
    id: 'reason',
    header: 'Reason',
    accessorFn: (d) => d.reason,
    cell: ({ row }) => <span className="capitalize">{row.original.reason.replace(/_/g, ' ')}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'amount',
    accessorFn: (d) => d.amount.amount,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => formatMoney(row.original.amount),
  },
  {
    id: 'assigned',
    header: 'Assigned',
    cell: ({ row }) =>
      row.original.assignedTo ? (
        <span className="text-sm">{row.original.assignedTo}</span>
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      ),
  },
  {
    id: 'created',
    accessorFn: (d) => d.createdAt,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Opened" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{formatDate(row.original.createdAt)}</span>
    ),
  },
];

export function DisputesTable() {
  const url = useUrlState();
  const router = useRouter();
  const status = url.get('status') as DisputeStatus | undefined;
  const list = useAdminDisputes({ page: url.page, pageSize: 10, ...(status ? { status } : {}) });
  if (list.isError)
    return <ErrorState description={getErrorMessage(list.error)} onRetry={() => list.refetch()} />;
  return (
    <>
      <PageHeader title="Disputes" description="Customer complaints that need a decision." />
      <DataTable
        columns={columns}
        data={list.data?.data ?? []}
        isLoading={list.isPending}
        searchable={false}
        getRowId={(d) => d.id}
        onRowClick={(d) => router.push(`/disputes/${d.id}`)}
        emptyTitle="No disputes"
        emptyDescription="Nothing matches this filter."
        serverPagination={{
          page: list.data?.meta.page ?? url.page,
          pageSize: 10,
          total: list.data?.meta.total ?? 0,
          onPageChange: (page) => url.set({ page }),
        }}
        toolbar={
          <FilterBar
            filters={[{ param: 'status', label: 'Status', options: STATUSES, width: 'w-[210px]' }]}
          />
        }
      />
    </>
  );
}
