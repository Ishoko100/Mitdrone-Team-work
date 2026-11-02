'use client';

import { ROLE_LABELS } from '@mitdrone/auth';
import { api, getErrorMessage, useAuditLogs } from '@mitdrone/sdk';
import { Badge, DataTable, ErrorState, PageHeader } from '@mitdrone/ui';
import { formatDateTime } from '@mitdrone/utils';

import { ExportMenu } from '@/components/common/export-menu';
import { FilterBar } from '@/components/common/filter-bar';
import { useUrlState } from '@/lib/url';

import type { AuditAction, AuditEntityType, AuditLog } from '@mitdrone/types';
import type { ColumnDef } from '@tanstack/react-table';

const ACTIONS: AuditAction[] = [
  'vendor.approve',
  'vendor.reject',
  'vendor.suspend',
  'product.approve',
  'product.flag',
  'product.delete',
  'order.refund',
  'dispute.assign',
  'dispute.resolve',
  'payout.process',
  'payout.hold',
  'user.update_role',
  'user.suspend',
  'settings.update',
  'export.create',
];
const ENTITIES: AuditEntityType[] = [
  'vendor',
  'product',
  'order',
  'dispute',
  'payout',
  'user',
  'settings',
];
const label = (a: string) => a.replace('.', ' · ').replace(/_/g, ' ');
const variant = (a: string) =>
  /reject|suspend|delete|refund|hold|flag/.test(a)
    ? 'destructive'
    : /approve|process|resolve/.test(a)
      ? 'success'
      : 'secondary';

const columns: ColumnDef<AuditLog>[] = [
  {
    id: 'time',
    accessorFn: (l) => l.createdAt,
    header: 'When',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{formatDateTime(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'actor',
    header: 'Actor',
    accessorFn: (l) => l.actorName,
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <p className="font-medium">{row.original.actorName}</p>
        <p className="text-muted-foreground text-xs">{ROLE_LABELS[row.original.actorRole]}</p>
      </div>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => (
      <Badge variant={variant(row.original.action)} className="capitalize">
        {label(row.original.action)}
      </Badge>
    ),
  },
  {
    id: 'entity',
    header: 'Entity',
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm">
        <span className="capitalize">{row.original.entityType}</span>{' '}
        <span className="text-muted-foreground font-mono text-xs">{row.original.entityId}</span>
      </span>
    ),
  },
  {
    id: 'summary',
    header: 'Details',
    cell: ({ row }) => {
      const reason =
        typeof row.original.metadata?.['reason'] === 'string'
          ? row.original.metadata['reason']
          : undefined;
      return (
        <div className="min-w-[260px] max-w-md">
          <p>{row.original.summary}</p>
          {reason ? <p className="text-muted-foreground text-xs">Reason: {reason}</p> : null}
        </div>
      );
    },
  },
  {
    accessorKey: 'ip',
    header: 'IP',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip ?? '–'}</span>,
  },
];

export function AuditTable() {
  const url = useUrlState();
  const action = url.get('action') as AuditAction | undefined;
  const entityType = url.get('entityType') as AuditEntityType | undefined;
  const q = url.get('q');
  const filters = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(q ? { q } : {}),
  };
  const list = useAuditLogs({ page: url.page, pageSize: 15, ...filters });
  if (list.isError)
    return <ErrorState description={getErrorMessage(list.error)} onRetry={() => list.refetch()} />;
  return (
    <>
      <PageHeader
        title="Audit logs"
        description="A permanent record of every admin action. Exports are logged too."
        actions={
          <ExportMenu
            entity="audit-logs"
            title="Mitdrone audit log"
            fetchData={async () => {
              const all = await api.admin.auditLogs({ ...filters, pageSize: 100 });
              return {
                headers: [
                  'When',
                  'Actor',
                  'Role',
                  'Action',
                  'Entity',
                  'Entity ID',
                  'Summary',
                  'IP',
                ],
                rows: all.data.map((l) => [
                  l.createdAt,
                  l.actorName,
                  l.actorRole,
                  l.action,
                  l.entityType,
                  l.entityId,
                  l.summary,
                  l.ip ?? '',
                ]),
              };
            }}
          />
        }
      />
      <DataTable
        columns={columns}
        data={list.data?.data ?? []}
        isLoading={list.isPending}
        searchable={false}
        getRowId={(l) => l.id}
        emptyTitle="No audit entries match"
        serverPagination={{
          page: list.data?.meta.page ?? url.page,
          pageSize: 15,
          total: list.data?.meta.total ?? 0,
          onPageChange: (page) => url.set({ page }),
        }}
        toolbar={
          <FilterBar
            searchPlaceholder="Search summary, actor or ID"
            filters={[
              {
                param: 'action',
                label: 'Action',
                options: ACTIONS.map((a) => [a, label(a)] as const),
                width: 'w-[210px]',
              },
              {
                param: 'entityType',
                label: 'Entity',
                options: ENTITIES.map((e) => [e, e[0]?.toUpperCase() + e.slice(1)] as const),
              },
            ]}
          />
        }
      />
    </>
  );
}
