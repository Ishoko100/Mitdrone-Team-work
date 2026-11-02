'use client';

import { useAuth } from '@mitdrone/auth';
import {
  getErrorMessage,
  isApiError,
  isMockStripeKey,
  useAddAddress,
  useAddresses,
  useCartQuote,
  useConfirmCheckout,
  useCreatePaymentIntent,
} from '@mitdrone/sdk';
import { Button, EmptyState, RadioGroup, RadioGroupItem, Skeleton, cn } from '@mitdrone/ui';
import { formatCurrency } from '@mitdrone/utils';
import { ShoppingCart } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { OrderSummary } from '@/components/cart/order-summary';
import { env } from '@/lib/env';
import { useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

import { AddressForm } from './address-form';
import { MockCardForm } from './mock-card-form';

import type { PaymentMethodInput } from './payment-types';
import type { AddressInput } from '@mitdrone/types';

// Stripe's JS is only downloaded when a real publishable key is configured.
const StripeCardForm = dynamic(() => import('./stripe-card-form'), {
  ssr: false,
  loading: () => <Skeleton className="h-24 w-full" />,
});

const NEW = '__new__';
const STEPS = ['Shipping', 'Payment'] as const;

export function CheckoutFlow() {
  const router = useRouter();
  const { user } = useAuth();
  const lines = useCartStore((s) => s.lines);
  const hydrated = useCartStore((s) => s.hydrated);
  const coupon = useUiStore((s) => s.couponCode);
  const addresses = useAddresses();
  const addAddress = useAddAddress();
  const createIntent = useCreatePaymentIntent();
  const confirm = useConfirmCheckout();
  const [step, setStep] = useState<0 | 1>(0);
  const [choice, setChoice] = useState<string>();
  const [shipping, setShipping] = useState<AddressInput>();
  const [error, setError] = useState<{ message: string; stock: boolean }>();

  const items = lines.map((l) => ({
    productId: l.productId,
    ...(l.variantId ? { variantId: l.variantId } : {}),
    quantity: l.quantity,
  }));
  const quote = useCartQuote(
    { items, ...(coupon ? { couponCode: coupon } : {}) },
    { enabled: hydrated },
  );

  if (!hydrated) return <Skeleton className="h-96 w-full" />;
  if (lines.length === 0)
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Add something to your cart to check out."
        action={
          <Button asChild>
            <Link href="/products">Start shopping</Link>
          </Button>
        }
      />
    );

  const saved = addresses.data ?? [];
  const selected = choice ?? saved.find((a) => a.isDefault)?.id ?? saved[0]?.id ?? NEW;
  const useStripe = !isMockStripeKey(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  function useSaved() {
    const a = saved.find((x) => x.id === selected);
    if (!a) return;
    setShipping({
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      ...(a.line2 ? { line2: a.line2 } : {}),
      city: a.city,
      state: a.state,
      ...(a.postalCode ? { postalCode: a.postalCode } : {}),
      country: a.country,
    });
    setStep(1);
  }

  async function pay(method: PaymentMethodInput) {
    if (!shipping) return;
    setError(undefined);
    try {
      const intent = await createIntent.mutateAsync({ items, shippingAddress: shipping });
      const order = await confirm.mutateAsync({
        items,
        shippingAddress: shipping,
        paymentIntentId: intent.id,
        paymentMethod: method,
        ...(coupon ? { couponCode: coupon } : {}),
      });
      useCartStore.getState().clear();
      useUiStore.getState().setCouponCode('');
      router.replace(`/account/orders/${order.id}?placed=1`);
    } catch (e) {
      setError({
        message: getErrorMessage(e),
        stock: isApiError(e) && e.code === 'insufficient_stock',
      });
    }
  }

  const busy = createIntent.isPending || confirm.isPending;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <ol className="flex gap-2 text-sm" aria-label="Checkout steps">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={step === i ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1',
                step === i
                  ? 'border-primary bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground',
              )}
            >
              <span className="bg-primary/10 flex size-5 items-center justify-center rounded-full text-xs">
                {i + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <section aria-labelledby="ship-h" className="bg-card space-y-5 rounded-xl border p-5">
            <h2 id="ship-h" className="text-xl font-semibold">
              Shipping address
            </h2>
            {addresses.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <RadioGroup value={selected} onValueChange={setChoice} aria-label="Choose an address">
                {saved.map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-lg border p-4',
                      selected === a.id && 'border-primary bg-accent/40',
                    )}
                  >
                    <RadioGroupItem value={a.id} className="mt-1" />
                    <span className="text-sm">
                      <span className="block font-medium">
                        {a.fullName} {a.label ? `· ${a.label}` : ''}
                      </span>
                      <span className="text-muted-foreground block">
                        {a.line1}, {a.city}, {a.state}
                      </span>
                      <span className="text-muted-foreground block">{a.phone}</span>
                    </span>
                  </label>
                ))}
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm font-medium',
                    selected === NEW && 'border-primary bg-accent/40',
                  )}
                >
                  <RadioGroupItem value={NEW} />
                  Use a new address
                </label>
              </RadioGroup>
            )}
            {selected === NEW ? (
              <AddressForm
                defaultName={user?.name ?? ''}
                submitLabel="Continue to payment"
                allowSave
                onSubmit={async (address, save) => {
                  if (save) await addAddress.mutateAsync(address).catch(() => undefined);
                  setShipping(address);
                  setStep(1);
                }}
              />
            ) : (
              <Button size="lg" onClick={useSaved}>
                Continue to payment
              </Button>
            )}
          </section>
        ) : (
          <section aria-labelledby="pay-h" className="bg-card space-y-5 rounded-xl border p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 id="pay-h" className="text-xl font-semibold">
                Payment
              </h2>
              <Button variant="link" className="h-auto p-0" onClick={() => setStep(0)}>
                Change address
              </Button>
            </div>
            {shipping ? (
              <p className="text-muted-foreground text-sm">
                Delivering to <strong className="text-foreground">{shipping.fullName}</strong>,{' '}
                {shipping.line1}, {shipping.city}, {shipping.state}
              </p>
            ) : null}
            {error ? (
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/5 space-y-2 rounded-lg border p-4 text-sm"
              >
                <p className="text-destructive font-medium">{error.message}</p>
                {error.stock ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/cart">Review your cart</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
            {useStripe ? (
              <StripeCardForm
                onSubmit={pay}
                busy={busy}
                label={`Pay ${quote.data ? formatCurrency(quote.data.total.amount) : ''}`}
              />
            ) : (
              <MockCardForm
                onSubmit={pay}
                busy={busy}
                label={`Pay ${quote.data ? formatCurrency(quote.data.total.amount) : ''}`}
              />
            )}
          </section>
        )}
      </div>

      <aside
        className="bg-card shadow-soft h-fit space-y-5 rounded-xl border p-5"
        aria-label="Order summary"
      >
        <h2 className="text-lg font-semibold">Order summary</h2>
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.key} className="flex gap-3 text-sm">
              <span className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-md">
                {l.imageUrl ? (
                  <Image src={l.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2">{l.title}</span>
                <span className="text-muted-foreground">Qty {l.quantity}</span>
              </span>
              <span className="font-medium">{formatCurrency(l.unitPrice.amount * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <OrderSummary quote={quote.data} isLoading={quote.isFetching} error={quote.error} />
        <Button asChild variant="link" className="w-full">
          <Link href="/cart">Edit cart</Link>
        </Button>
      </aside>
    </div>
  );
}
