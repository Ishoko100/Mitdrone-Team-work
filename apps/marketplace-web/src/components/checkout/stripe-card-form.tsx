'use client';

import { Button } from '@mitdrone/ui';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useMemo, useState } from 'react';

import { env } from '@/lib/env';

import type { PaymentMethodInput } from './payment-types';

function Inner({
  onSubmit,
  busy,
  label,
}: {
  onSubmit: (method: PaymentMethodInput) => void;
  busy: boolean;
  label: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>();
  const [creating, setCreating] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const card = elements?.getElement(CardElement);
        if (!stripe || !card) return;
        setCreating(true);
        setError(undefined);
        // Real Stripe Elements UI. The PaymentMethod is only used to read last4/brand: the backend is mocked.
        const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
          type: 'card',
          card,
        });
        setCreating(false);
        if (stripeError || !paymentMethod?.card)
          return setError(stripeError?.message ?? 'Could not read the card');
        onSubmit({ last4: paymentMethod.card.last4, brand: paymentMethod.card.brand });
      }}
    >
      <div className="border-input bg-background rounded-md border p-3">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={busy || creating}
        disabled={!stripe}
      >
        {label}
      </Button>
    </form>
  );
}

export default function StripeCardForm(props: {
  onSubmit: (method: PaymentMethodInput) => void;
  busy: boolean;
  label: string;
}) {
  const stripePromise = useMemo(() => loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY), []);
  return (
    <Elements stripe={stripePromise}>
      <Inner {...props} />
    </Elements>
  );
}
