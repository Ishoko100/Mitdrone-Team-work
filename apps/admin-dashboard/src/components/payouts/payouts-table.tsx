'use client';

import { useAuth } from '@mitdrone/auth';
import {
  api,
  getErrorMessage,
  useAdminPayouts,
  useHoldPayout,
  useProcessPayout,
} from '@mitdrone/sdk';
import {
  Button,
  ConfirmDialog,
  DataTable,
  DataTableColumnHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ErrorState,
  KpiCard,
  PageHeader,
  ReasonDialog,
  StatusBadge,
  toast,
} from '@mitdrone/ui';
import { formatDate, formatMoney, sumMoney } from '@mitdrone/utils';
import { Banknote, CheckCircle2, Clock, MoreHorizontal, PauseCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ExportMenu } from '@/components/common/export-menu';
import { FilterBar } from '@/components/common/filter-bar';
import { useUrlState } from '@/lib/url';

import type { Payout, PayoutStatus } from '@mitdrone/types';
import type { ColumnDef } from '@tanstack/react-table';

const STATUSES: [PayoutStatus, string][] = [
  ['pending', 'Pending'],
  ['processing', 'Processing'],
  ['paid', 'Paid'],
  ['on_hold', 'On hold'],
  ['failed', 'Failed'],
];
const OPEN: PayoutStatus[] = ['pending', 'processing'];
type Pending =
  { kind: 'process'; payouts: Payout[]; done?: () => void } | { kind: 'hold'; payout: Payout };

export function PayoutsTable() {
  const { can } = useAuth();
  const url = useUrlState();
  const status = url.get('status') as PayoutStatus | undefined;
  const list = useAdminPayouts({ page: url.page, pageSize: 10, ...(status ? { status } : {}) });
  const all = useAdminPayouts({ pageSize: 100 });
  const process = useProcessPayout();
  const hold = useHoldPayout();
  const [pending, setPending] = useState<Pending>();
  const write = can('admin.write');
  const totals = useMemo(() => {
    const rows = all.data?.data ?? [];
    const by = (s: PayoutStatus[]) =>
      sumMoney(rows.filter((p) => s.includes(p.status)).map((p) => p.amount));
    return { open: by(OPEN), hold: by(['on_hold']), paid: by(['paid']) };
  }, [all.data]);

  const columns = useMemo<ColumnDef<Payout>[]>(
    () => [
      {
        accessorKey: 'vendorName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.vendorName}</p>
            <p className="text-muted-foreground font-mono text-xs">{row.original.id}</p>
          </div>
        ),
      },
      {
        id: 'period',
        header: 'Period',
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDate(row.original.periodStart)} to {formatDate(row.original.periodEnd)}
          </span>
        ),
      },
      {
        id: 'bank',
        header: 'Bank',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.bank.bankName}
            <span className="text-muted-foreground block text-xs">
              •••• {row.original.bank.accountNumber.slice(-4)}
            </span>
          </span>
        ),
      },
      {
        id: 'amount',
        accessorFn: (p) => p.amount.amount,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => <span className="font-medium">{formatMoney(row.original.amount)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="space-y-1">
            <StatusBadge status={row.original.status} />
            {row.original.failureReason ? (
              <p className="text-muted-foreground max-w-[180px] text-xs">
                {row.original.failureReason}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const p = row.original;
          return write && p.status !== 'paid' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Actions for payout ${p.id}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setPending({ kind: 'process', payouts: [p] })}>
                  <CheckCircle2 /> Process payout
                </DropdownMenuItem>
                {p.status !== 'on_hold' ? (
                  <DropdownMenuItem
                    destructive
                    onSelect={() => setPending({ kind: 'hold', payout: p })}
                  >
                    <PauseCircle /> Put on hold
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="sr-only">No actions</span>
          );
        },
      },
    ],
    [write],
  );

  if (list.isError)
    return <ErrorState description={getErrorMessage(list.error)} onRetry={() => list.refetch()} />;
  const fail = (e: unknown) => toast.error(getErrorMessage(e));

  return (
    <>
      <PageHeader
        title="Payouts"
        description="Pay sellers their share after commission."
        actions={
          <ExportMenu
            entity="payouts"
            title="Mitdrone payouts"
            fetchData={async () => {
              const rows = await api.admin.payouts({
                ...(status ? { status } : {}),
                pageSize: 100,
              });
              return {
                headers: [
                  'Payout',
                  'Vendor',
                  'Period start',
                  'Period end',
                  'Amount (NGN)',
                  'Fee (NGN)',
                  'Status',
                  'Bank',
                ],
                rows: rows.data.map((p) => [
                  p.id,
                  p.vendorName,
                  formatDate(p.periodStart),
                  formatDate(p.periodEnd),
                  p.amount.amount / 100,
                  p.fee.amount / 100,
                  p.status,
                  p.bank.bankName,
                ]),
              };
            }}
          />
        }
      />
      <section aria-label="Payout totals" className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Awaiting payment"
          icon={Clock}
          value={all.data ? formatMoney(totals.open) : '–'}
          loading={all.isPending}
        />
        <KpiCard
          label="On hold"
          icon={PauseCircle}
          value={all.data ? formatMoney(totals.hold) : '–'}
          loading={all.isPending}
        />
        <KpiCard
          label="Paid out"
          icon={Banknote}
          value={all.data ? formatMoney(totals.paid) : '–'}
          loading={all.isPending}
        />
      </section>
      <DataTable
        columns={columns}
        data={list.data?.data ?? []}
        isLoading={list.isPending}
        searchable={false}
        enableSelection={write}
        getRowId={(p) => p.id}
        emptyTitle="No payouts match this filter"
        serverPagination={{
          page: list.data?.meta.page ?? url.page,
          pageSize: 10,
          total: list.data?.meta.total ?? 0,
          onPageChange: (page) => url.set({ page }),
        }}
        toolbar={<FilterBar filters={[{ param: 'status', label: 'Status', options: STATUSES }]} />}
        bulkActions={(rows, clear) => {
          const open = rows.filter((r) => OPEN.includes(r.status));
          return (
            <Button
              size="sm"
              disabled={open.length === 0}
              onClick={() => setPending({ kind: 'process', payouts: open, done: clear })}
            >
              <CheckCircle2 /> Process {open.length || ''} payout{open.length === 1 ? '' : 's'}
            </Button>
          );
        }}
      />
      <ConfirmDialog
        open={pending?.kind === 'process'}
        onOpenChange={(o) => !o && setPending(undefined)}
        title={
          pending?.kind === 'process'
            ? `Process ${pending.payouts.length} payout${pending.payouts.length === 1 ? '' : 's'}?`
            : ''
        }
        description={
          pending?.kind === 'process'
            ? `${formatMoney(sumMoney(pending.payouts.map((p) => p.amount)))} will be sent to seller bank accounts. Each payout is recorded in the audit log.`
            : ''
        }
        confirmLabel="Process"
        onConfirm={async () => {
          if (pending?.kind !== 'process') return;
          const r = await Promise.allSettled(pending.payouts.map((p) => process.mutateAsync(p.id)));
          const ok = r.filter((x) => x.status === 'fulfilled').length;
          toast[ok === r.length ? 'success' : 'warning'](`${ok} of ${r.length} processed`);
          pending.done?.();
        }}
      />
      <ReasonDialog
        open={pending?.kind === 'hold'}
        onOpenChange={(o) => !o && setPending(undefined)}
        title="Put payout on hold?"
        description="Use for suspected fraud or unresolved disputes. The reason is saved and visible to staff."
        confirmLabel="Put on hold"
        destructive
        onConfirm={async (reason) => {
          if (pending?.kind === 'hold')
            await hold
              .mutateAsync({ id: pending.payout.id, reason })
              .then(() => toast.success('Payout put on hold'))
              .catch(fail);
        }}
      />
    </>
  );
}
