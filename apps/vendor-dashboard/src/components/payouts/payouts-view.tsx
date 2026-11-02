'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@mitdrone/auth';
import {
  getErrorMessage,
  useUpdateBank,
  useVendorBalance,
  useVendorLedger,
  useVendorPayouts,
  useVendorSettings,
} from '@mitdrone/sdk';
import {
  Badge,
  Button,
  DataTable,
  DataTableColumnHeader,
  ErrorState,
  Form,
  KpiCard,
  PageHeader,
  RootError,
  SelectField,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
  toast,
} from '@mitdrone/ui';
import { formatDate, formatMoney } from '@mitdrone/utils';
import { Clock, Landmark, PiggyBank, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { applyApiError } from '@/lib/forms';

import type { BankDetails, LedgerEntry, Payout } from '@mitdrone/types';
import type { ColumnDef } from '@tanstack/react-table';

const BANKS = ['Access Bank', 'First Bank', 'GTBank', 'Kuda', 'UBA', 'Zenith Bank'];
const bankSchema = z.object({
  bankName: z.string().min(2, 'Choose your bank'),
  accountName: z.string().min(2, 'Required'),
  accountNumber: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
});

const payoutColumns: ColumnDef<Payout>[] = [
  {
    accessorKey: 'id',
    header: 'Payout',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
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
    id: 'amount',
    accessorFn: (p) => p.amount.amount,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => <span className="font-medium">{formatMoney(row.original.amount)}</span>,
  },
  { id: 'fee', header: 'Fee', cell: ({ row }) => formatMoney(row.original.fee) },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'processed',
    header: 'Paid on',
    cell: ({ row }) =>
      row.original.processedAt ? (
        formatDate(row.original.processedAt)
      ) : (
        <span className="text-muted-foreground">Not yet</span>
      ),
  },
];
const ledgerColumns: ColumnDef<LedgerEntry>[] = [
  {
    id: 'date',
    accessorFn: (l) => l.createdAt,
    header: 'Date',
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize">
        {row.original.type}
      </Badge>
    ),
  },
  { accessorKey: 'description', header: 'Description' },
  {
    id: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className={row.original.amount.amount < 0 ? 'text-destructive' : 'text-success'}>
        {formatMoney(row.original.amount)}
      </span>
    ),
  },
  { id: 'balance', header: 'Balance', cell: ({ row }) => formatMoney(row.original.balanceAfter) },
];

function BankForm({
  bank,
  vendorId,
  canEdit,
}: {
  bank: BankDetails | undefined;
  vendorId: string;
  canEdit: boolean;
}) {
  const update = useUpdateBank(vendorId);
  const form = useForm<BankDetails>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: bank?.bankName ?? '',
      accountName: bank?.accountName ?? '',
      accountNumber: bank?.accountNumber ?? '',
    },
  });
  return (
    <Form {...form}>
      <form
        className="bg-card max-w-xl space-y-4 rounded-xl border p-5"
        noValidate
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await update.mutateAsync(v);
            toast.success('Bank details updated');
          } catch (e) {
            applyApiError(form, e);
          }
        })}
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Landmark className="size-5" aria-hidden="true" /> Bank details
        </h2>
        {!canEdit ? (
          <p role="status" className="bg-muted rounded-lg p-3 text-sm">
            Only the store owner can change payout details.
          </p>
        ) : null}
        <RootError message={form.formState.errors.root?.message} />
        <fieldset disabled={!canEdit} className="space-y-4">
          <SelectField control={form.control} name="bankName" label="Bank" options={BANKS} />
          <TextField control={form.control} name="accountName" label="Account name" />
          <TextField
            control={form.control}
            name="accountNumber"
            label="Account number"
            inputMode="numeric"
          />
        </fieldset>
        {canEdit ? (
          <Button type="submit" loading={form.formState.isSubmitting}>
            Save bank details
          </Button>
        ) : null}
      </form>
    </Form>
  );
}

export function PayoutsView() {
  const { user, can } = useAuth();
  const v = user?.vendorId;
  const [payoutPage, setPayoutPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const balance = useVendorBalance(v);
  const payouts = useVendorPayouts(v, { page: payoutPage, pageSize: 8 });
  const ledger = useVendorLedger(v, { page: ledgerPage, pageSize: 10 });
  const settings = useVendorSettings(v);

  if (balance.isError)
    return (
      <ErrorState description={getErrorMessage(balance.error)} onRetry={() => balance.refetch()} />
    );
  return (
    <>
      <PageHeader title="Payouts" description="Your balance, payout history and bank details." />
      <section aria-label="Balance" className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Available balance"
          icon={Wallet}
          value={balance.data ? formatMoney(balance.data.available) : '–'}
          loading={balance.isPending}
          hint="Paid out on the next run"
        />
        <KpiCard
          label="Pending payouts"
          icon={Clock}
          value={balance.data ? formatMoney(balance.data.pending) : '–'}
          loading={balance.isPending}
        />
        <KpiCard
          label="Lifetime earnings"
          icon={PiggyBank}
          value={balance.data ? formatMoney(balance.data.lifetimeEarnings) : '–'}
          loading={balance.isPending}
          hint="After commission"
        />
      </section>
      <Tabs defaultValue="payouts">
        <TabsList>
          <TabsTrigger value="payouts">Payout history</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="bank">Bank details</TabsTrigger>
        </TabsList>
        <TabsContent value="payouts">
          <DataTable
            columns={payoutColumns}
            data={payouts.data?.data ?? []}
            isLoading={payouts.isPending}
            searchable={false}
            emptyTitle="No payouts yet"
            emptyDescription="Payouts appear once you have completed sales."
            serverPagination={{
              page: payoutPage,
              pageSize: 8,
              total: payouts.data?.meta.total ?? 0,
              onPageChange: setPayoutPage,
            }}
          />
        </TabsContent>
        <TabsContent value="ledger">
          <DataTable
            columns={ledgerColumns}
            data={ledger.data?.data ?? []}
            isLoading={ledger.isPending}
            searchable={false}
            emptyTitle="No transactions yet"
            serverPagination={{
              page: ledgerPage,
              pageSize: 10,
              total: ledger.data?.meta.total ?? 0,
              onPageChange: setLedgerPage,
            }}
          />
        </TabsContent>
        <TabsContent value="bank">
          {settings.data ? (
            <BankForm
              bank={settings.data.bank}
              vendorId={settings.data.id}
              canEdit={can('vendor.bank.edit')}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Loading…</p>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
