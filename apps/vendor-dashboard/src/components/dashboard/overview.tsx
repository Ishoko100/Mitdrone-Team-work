'use client';

import { useAuth } from '@mitdrone/auth';
import {
  getErrorMessage,
  useVendorBalance,
  useVendorDashboard,
  useVendorInventory,
  useVendorOrders,
  useVendorSettings,
} from '@mitdrone/sdk';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
  Skeleton,
  StatusBadge,
} from '@mitdrone/ui';
import { formatDate, formatMoney } from '@mitdrone/utils';
import { AlertTriangle, CreditCard, Package, Percent, ShoppingBag, Wallet } from 'lucide-react';
import Link from 'next/link';

import { compactNaira, toNairaSeries } from '@/lib/money';

import { TimeSeriesChart } from './lazy-charts';

export function Overview({
  backendHealth,
}: {
  backendHealth?: { status?: string; service?: string } | undefined;
}) {
  const { user } = useAuth();
  const v = user?.vendorId;
  const vendor = useVendorSettings(v).data;
  const dash = useVendorDashboard(v);
  const balance = useVendorBalance(v);
  const orders = useVendorOrders(v, { pageSize: 5 });
  const lowStock = useVendorInventory(v, { lowStock: true, pageSize: 5 });

  if (dash.isError)
    return <ErrorState description={getErrorMessage(dash.error)} onRetry={() => dash.refetch()} />;
  const approved = vendor?.status === 'approved';

  return (
    <>
      <PageHeader
        title={`Welcome back${user ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Here is how your store performed in the last 30 days."
        actions={
          <>
            {backendHealth ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {backendHealth.service === 'mitdrone-backend' ? '●' : '○'}
                {backendHealth.status === 'ok' ? 'Backend live' : 'Backend degraded'}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                ○ Backend unavailable
              </span>
            )}
            {approved ? (
              <Button asChild>
                <Link href="/products/new">Add product</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/onboarding">Finish setup</Link>
              </Button>
            )}
          </>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue (30 days)"
          icon={CreditCard}
          value={dash.data ? formatMoney(dash.data.revenue) : '–'}
          loading={dash.isPending}
        />
        <KpiCard
          label="Orders"
          icon={ShoppingBag}
          value={dash.data ? String(dash.data.orders) : '–'}
          loading={dash.isPending}
        />
        <KpiCard
          label="Conversion rate"
          icon={Percent}
          value={dash.data ? `${dash.data.conversionRate}%` : '–'}
          loading={dash.isPending}
        />
        <KpiCard
          label="Available balance"
          icon={Wallet}
          value={balance.data ? formatMoney(balance.data.available) : '–'}
          hint={balance.data ? `${formatMoney(balance.data.pending)} pending` : undefined}
          loading={balance.isPending}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sales over time</CardTitle>
            <CardDescription>Daily revenue, last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {dash.isPending ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <TimeSeriesChart
                ariaLabel="Daily revenue for the last 30 days"
                data={toNairaSeries(dash.data.salesSeries, 'revenue')}
                series={[{ key: 'revenue', label: 'Revenue' }]}
                valueFormatter={compactNaira}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>By revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {dash.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : dash.data.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales yet.</p>
            ) : (
              <ol className="space-y-3">
                {dash.data.topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-start gap-3 text-sm">
                    <span className="bg-accent text-accent-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-medium">{p.title}</span>
                      <span className="text-muted-foreground">{p.units} sold</span>
                    </span>
                    <span className="font-medium">{formatMoney(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent orders</CardTitle>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {orders.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : orders.data?.data.length ? (
              <ul className="divide-y">
                {orders.data.data.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/orders/${o.id}`}
                      className="hover:text-primary flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <span>
                        <span className="font-medium">{o.number}</span>
                        <span className="text-muted-foreground block">
                          {o.customerName} · {formatDate(o.createdAt)}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="font-medium">{formatMoney(o.total)}</span>
                        <StatusBadge status={o.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="Orders appear here as soon as customers buy."
                className="border-0 py-8"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-warning size-4" aria-hidden="true" />
              Low stock
            </CardTitle>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/inventory?lowStock=true">Manage inventory</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStock.isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : lowStock.data?.data.length ? (
              <ul className="divide-y">
                {lowStock.data.data.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="line-clamp-1">{p.title}</span>
                    <span className="text-warning shrink-0 font-semibold">
                      {p.inventory.quantity} left
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Package}
                title="Stock levels look healthy"
                className="border-0 py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
