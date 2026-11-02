'use client';

import { useAuth } from '@mitdrone/auth';
import { api, keys, useVendorSettings } from '@mitdrone/sdk';
import { Button, PageHeader, Skeleton } from '@mitdrone/ui';
import { formatDate } from '@mitdrone/utils';
import { useQueries } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export function PackingSlips() {
  const { user } = useAuth();
  const v = user?.vendorId ?? '';
  const ids = (useSearchParams().get('ids') ?? '').split(',').filter(Boolean).slice(0, 50);
  const vendor = useVendorSettings(v).data;
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: keys.seller(v, 'order', id),
      queryFn: () => api.seller.order(v, id),
      enabled: Boolean(v),
    })),
  });
  const loading = results.some((r) => r.isPending);
  const orders = results.flatMap((r) => (r.data ? [r.data] : []));

  if (ids.length === 0)
    return <p className="text-muted-foreground">Select orders to print from the Orders page.</p>;
  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="Packing slips"
          description={`${ids.length} slip${ids.length === 1 ? '' : 's'} ready to print.`}
          actions={
            <Button onClick={() => window.print()} disabled={loading}>
              <Printer /> Print
            </Button>
          }
        />
      </div>
      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="space-y-6 print:space-y-0">
          {orders.map((o) => (
            <article
              key={o.id}
              className="bg-card rounded-xl border p-8 print:break-after-page print:rounded-none print:border-0 print:p-0"
            >
              <header className="flex items-start justify-between border-b pb-4">
                <div>
                  <p className="text-xl font-semibold">{vendor?.name ?? 'Mitdrone seller'}</p>
                  <p className="text-muted-foreground text-sm">
                    {vendor?.city}, {vendor?.state}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">Packing slip</p>
                  <p className="text-sm">Order {o.number}</p>
                  <p className="text-muted-foreground text-sm">{formatDate(o.createdAt)}</p>
                </div>
              </header>
              <div className="grid gap-6 py-5 sm:grid-cols-2">
                <section>
                  <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    Ship to
                  </h2>
                  <address className="mt-1 text-sm not-italic">
                    {o.shippingAddress.fullName}
                    <br />
                    {o.shippingAddress.line1}
                    {o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ''}
                    <br />
                    {o.shippingAddress.city}, {o.shippingAddress.state}
                    <br />
                    {o.shippingAddress.phone}
                  </address>
                </section>
                <section>
                  <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                    Delivery
                  </h2>
                  <p className="mt-1 text-sm">
                    {o.carrier ?? 'Carrier to be assigned'}
                    <br />
                    {o.trackingNumber ? `Tracking ${o.trackingNumber}` : 'No tracking yet'}
                  </p>
                </section>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left text-xs uppercase tracking-wide">
                    <th scope="col" className="w-10 py-2">
                      Packed
                    </th>
                    <th scope="col">SKU</th>
                    <th scope="col">Item</th>
                    <th scope="col" className="text-right">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.id} className="border-b">
                      <td className="py-3">
                        <span
                          className="border-foreground inline-block size-4 rounded border"
                          aria-hidden="true"
                        />
                      </td>
                      <td className="font-mono text-xs">{i.sku}</td>
                      <td>{i.title}</td>
                      <td className="text-right font-medium">{i.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <footer className="text-muted-foreground mt-6 text-sm">
                Thank you for shopping on Mitdrone. Inspect your item on delivery and report any
                issue within 48 hours to use Buyer Protection.
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
