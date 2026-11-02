import { getErrorMessage } from '@mitdrone/sdk';
import { Skeleton } from '@mitdrone/ui';
import { formatMoney } from '@mitdrone/utils';

import type { Cart } from '@mitdrone/types';

/** Totals come from the API (cart quote), so shipping, VAT and coupons are always authoritative. */
export function OrderSummary({
  quote,
  isLoading,
  error,
}: {
  quote: Cart | undefined;
  isLoading: boolean;
  error?: unknown;
}) {
  if (error)
    return (
      <p
        role="alert"
        className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm"
      >
        {getErrorMessage(error)}
      </p>
    );
  if (!quote)
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-5 w-full" />
        ))}
      </div>
    );
  const rows: [string, string, boolean?][] = [
    ['Subtotal', formatMoney(quote.subtotal)],
    ['Shipping', quote.shipping.amount === 0 ? 'Free' : formatMoney(quote.shipping)],
    ['VAT (7.5%)', formatMoney(quote.tax)],
    ...(quote.discount.amount > 0
      ? ([
          [
            `Discount${quote.couponCode ? ` (${quote.couponCode})` : ''}`,
            `-${formatMoney(quote.discount)}`,
            true,
          ],
        ] as [string, string, boolean][])
      : []),
  ];
  return (
    <dl
      className={`space-y-2 text-sm transition-opacity ${isLoading ? 'opacity-60' : ''}`}
      aria-busy={isLoading}
    >
      {rows.map(([label, value, good]) => (
        <div key={label} className="flex justify-between">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={good ? 'text-success font-medium' : ''}>{value}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd>{formatMoney(quote.total)}</dd>
      </div>
    </dl>
  );
}
