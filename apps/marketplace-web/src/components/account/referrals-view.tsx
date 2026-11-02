'use client';

import { getErrorMessage, useReferrals } from '@mitdrone/sdk';
import {
  Button,
  ErrorState,
  KpiCard,
  Skeleton,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@mitdrone/ui';
import { formatDate, formatMoney } from '@mitdrone/utils';
import { Copy, Gift, ShoppingBag, Share2 } from 'lucide-react';

export function ReferralsView() {
  const { data, isPending, isError, error, refetch } = useReferrals();
  if (isPending)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  if (isError) return <ErrorState description={getErrorMessage(error)} onRetry={() => refetch()} />;

  const steps = [
    { icon: Share2, t: 'Share Mitdrone', d: 'Share your referral link.' },
    { icon: ShoppingBag, t: 'Someone buys', d: 'They complete a qualifying transaction.' },
    { icon: Gift, t: 'You earn', d: 'Receive your referral reward.' },
  ];
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Referrals</h1>
        <p className="text-muted-foreground text-sm">Earn a reward when someone you refer buys.</p>
      </header>
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, t, d }, i) => (
          <li key={t} className="bg-card flex gap-3 rounded-xl border p-4">
            <Icon className="text-primary mt-0.5 size-5" aria-hidden="true" />
            <span>
              <span className="sr-only">Step {i + 1}: </span>
              <span className="block font-medium">{t}</span>
              <span className="text-muted-foreground text-sm">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="bg-accent/40 flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Your referral link</p>
          <p className="truncate font-mono text-sm" data-testid="referral-link">
            {data.link}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await navigator.clipboard?.writeText(data.link);
            toast.success('Referral link copied');
          }}
        >
          <Copy /> Copy link
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="People referred" value={String(data.peopleReferred)} />
        <KpiCard label="Purchases" value={String(data.purchases)} />
        <KpiCard label="Pending rewards" value={formatMoney(data.pendingRewards)} />
        <KpiCard label="Available rewards" value={formatMoney(data.availableRewards)} />
        <KpiCard label="Total earned" value={formatMoney(data.totalEarned)} />
      </div>
      {data.entries.length > 0 ? (
        <div className="bg-card rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Reward</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.referredName}</TableCell>
                  <TableCell>{formatDate(e.joinedAt)}</TableCell>
                  <TableCell>{e.purchases}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(e.reward)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground">No referrals yet. Share your link to get started.</p>
      )}
    </div>
  );
}
