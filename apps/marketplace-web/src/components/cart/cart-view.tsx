'use client';

import { getErrorMessage, useCartQuote } from '@mitdrone/sdk';
import { Button, EmptyState, Input, Skeleton, toast } from '@mitdrone/ui';
import { formatCurrency } from '@mitdrone/utils';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

import { OrderSummary } from './order-summary';

export function CartView() {
  const lines = useCartStore((s) => s.lines);
  const hydrated = useCartStore((s) => s.hydrated);
  const { setQuantity, remove } = useCartStore.getState();
  const coupon = useUiStore((s) => s.couponCode);
  const setCoupon = useUiStore((s) => s.setCouponCode);
  const [draft, setDraft] = useState(coupon);
  const quote = useCartQuote(
    {
      items: lines.map((l) => ({
        productId: l.productId,
        ...(l.variantId ? { variantId: l.variantId } : {}),
        quantity: l.quantity,
      })),
      ...(coupon ? { couponCode: coupon } : {}),
    },
    { enabled: hydrated },
  );

  if (!hydrated)
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse drones, accessories and equipment from verified sellers."
        action={
          <Button asChild>
            <Link href="/products">Start shopping</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="bg-card divide-y rounded-xl border">
        {lines.map((line) => (
          <li key={line.key} className="flex gap-4 p-4">
            <Link
              href={`/products/${line.slug}`}
              className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-lg"
            >
              {line.imageUrl ? (
                <Image src={line.imageUrl} alt="" fill sizes="96px" className="object-cover" />
              ) : null}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Link
                href={`/products/${line.slug}`}
                className="line-clamp-2 font-medium hover:underline"
              >
                {line.title}
              </Link>
              <p className="text-muted-foreground text-sm">
                {formatCurrency(line.unitPrice.amount)} each
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                <div
                  className="inline-flex items-center rounded-md border"
                  role="group"
                  aria-label={`Quantity of ${line.title}`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(line.key, line.quantity - 1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
                    {line.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Increase quantity"
                    disabled={line.quantity >= line.maxQuantity}
                    onClick={() => setQuantity(line.key, line.quantity + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
                <p className="font-semibold">
                  {formatCurrency(line.unitPrice.amount * line.quantity)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => remove(line.key)}
                  aria-label={`Remove ${line.title}`}
                >
                  <Trash2 /> Remove
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside
        className="bg-card shadow-soft h-fit space-y-5 rounded-xl border p-5"
        aria-label="Order summary"
      >
        <h2 className="text-lg font-semibold">Order summary</h2>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setCoupon(draft.trim().toUpperCase());
            if (draft.trim()) toast.message('Checking coupon…');
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Coupon code (try WELCOME10)"
            aria-label="Coupon code"
          />
          <Button type="submit" variant="outline">
            Apply
          </Button>
        </form>
        {quote.isError && quote.error ? (
          <p
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm"
          >
            {getErrorMessage(quote.error)}
          </p>
        ) : null}
        {quote.isError ? null : <OrderSummary quote={quote.data} isLoading={quote.isFetching} />}
        <Button asChild size="lg" className="w-full" disabled={quote.isError}>
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
        <Button asChild variant="link" className="w-full">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </aside>
    </div>
  );
}
