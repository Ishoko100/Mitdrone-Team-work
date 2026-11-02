'use client';

import { useAuth } from '@mitdrone/auth';
import { getErrorMessage, useVendorAnalytics } from '@mitdrone/sdk';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  KpiCard,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mitdrone/ui';
import { downloadCsv, formatMoney } from '@mitdrone/utils';
import { Download, Percent, ReceiptText, ShoppingBag, TrendingUp } from 'lucide-react';

import { compactNaira, toNairaSeries } from '@/lib/money';
import { useUrlState } from '@/lib/url';

import { BarSeriesChart, DonutChart, TimeSeriesChart } from '../dashboard/lazy-charts';

import type { VendorAnalytics } from '@mitdrone/types';

const RANGES: { value: VendorAnalytics['range']; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

export function AnalyticsView() {
  const { user } = useAuth();
  const url = useUrlState();
  const range = (RANGES.find((r) => r.value === url.get('range'))?.value ??
    '30d') as VendorAnalytics['range'];
  const q = useVendorAnalytics(user?.vendorId, range);
  const d = q.data;

  if (q.isError)
    return <ErrorState description={getErrorMessage(q.error)} onRetry={() => q.refetch()} />;
  const revenue = d?.revenueSeries.reduce((s, p) => s + p.value, 0) ?? 0;
  const orders = d?.ordersSeries.reduce((s, p) => s + p.value, 0) ?? 0;
  const label = RANGES.find((r) => r.value === range)?.label.toLowerCase();

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Understand what sells and when."
        actions={
          <>
            <Select value={range} onValueChange={(v) => url.set({ range: v === '30d' ? null : v })}>
              <SelectTrigger aria-label="Date range" className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!d}
              onClick={() =>
                d &&
                downloadCsv(
                  `sales-${range}`,
                  d.revenueSeries.map((p, i) => ({
                    date: p.date,
                    revenue_naira: p.value / 100,
                    orders: d.ordersSeries[i]?.value ?? 0,
                    visits: d.visitsSeries[i]?.value ?? 0,
                  })),
                )
              }
            >
              <Download /> Export CSV
            </Button>
          </>
        }
      />
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          icon={TrendingUp}
          value={d ? formatMoney({ amount: revenue, currency: 'NGN' }) : '–'}
          loading={q.isPending}
          hint={label}
        />
        <KpiCard
          label="Orders"
          icon={ShoppingBag}
          value={d ? String(orders) : '–'}
          loading={q.isPending}
          hint={label}
        />
        <KpiCard
          label="Average order value"
          icon={ReceiptText}
          value={d ? formatMoney(d.averageOrderValue) : '–'}
          loading={q.isPending}
        />
        <KpiCard
          label="Conversion rate"
          icon={Percent}
          value={d ? `${d.conversionRate}%` : '–'}
          loading={q.isPending}
          hint="Visits to orders"
        />
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Daily sales</CardDescription>
          </CardHeader>
          <CardContent>
            {d ? (
              <TimeSeriesChart
                ariaLabel={`Daily revenue, ${label}`}
                data={toNairaSeries(d.revenueSeries, 'revenue')}
                series={[{ key: 'revenue', label: 'Revenue' }]}
                valueFormatter={compactNaira}
              />
            ) : (
              <Skeleton className="h-72 w-full" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Orders per day</CardDescription>
          </CardHeader>
          <CardContent>
            {d ? (
              <BarSeriesChart
                ariaLabel={`Orders per day, ${label}`}
                xKey="date"
                data={d.ordersSeries.map((p) => ({ date: p.date.slice(5), orders: p.value }))}
                series={[{ key: 'orders', label: 'Orders', color: 'hsl(var(--chart-2))' }]}
              />
            ) : (
              <Skeleton className="h-72 w-full" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Store visits</CardTitle>
            <CardDescription>Estimated visitors per day</CardDescription>
          </CardHeader>
          <CardContent>
            {d ? (
              <TimeSeriesChart
                ariaLabel={`Store visits per day, ${label}`}
                data={d.visitsSeries.map((p) => ({ date: p.date.slice(5), visits: p.value }))}
                series={[{ key: 'visits', label: 'Visits', color: 'hsl(var(--chart-5))' }]}
              />
            ) : (
              <Skeleton className="h-72 w-full" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales by category</CardTitle>
            <CardDescription>Share of revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {d ? (
              d.categoryBreakdown.length ? (
                <DonutChart
                  ariaLabel="Revenue by category"
                  data={d.categoryBreakdown.map((c) => ({
                    name: c.name,
                    value: Math.round(c.value / 100),
                  }))}
                />
              ) : (
                <p className="text-muted-foreground py-16 text-center text-sm">
                  No sales in this period.
                </p>
              )
            ) : (
              <Skeleton className="h-60 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top products</CardTitle>
        </CardHeader>
        <CardContent>
          {d && d.topProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.topProducts.map((p) => (
                  <TableRow key={p.productId}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-right">{p.units}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              {q.isPending ? 'Loading…' : 'No sales in this period.'}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
