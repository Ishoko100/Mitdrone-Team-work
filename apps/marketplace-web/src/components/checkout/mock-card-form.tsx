'use client';

import {
  formatCardNumber,
  TEST_CARDS,
  toPaymentMethod,
  validateCard,
  type CardInput,
} from '@mitdrone/sdk';
import { Button, Input, Label } from '@mitdrone/ui';
import { Lock } from 'lucide-react';
import { useState } from 'react';

import type { PaymentMethodInput } from './payment-types';

const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

/** Fallback when no Stripe key is configured. Nothing is charged and card data never leaves the browser. */
export function MockCardForm({
  onSubmit,
  busy,
  label,
}: {
  onSubmit: (method: PaymentMethodInput) => void;
  busy: boolean;
  label: string;
}) {
  const [card, setCard] = useState<CardInput>({ number: '', expiry: '', cvc: '' });
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const result = validateCard(card);
  const show = (k: keyof CardInput) => (touched ? result.errors[k] : undefined);

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (result.valid && name.trim().length >= 2) onSubmit(toPaymentMethod(card));
      }}
    >
      <p className="bg-muted text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
        <Lock className="size-3.5" aria-hidden="true" />
        Demo payment form. No real charge is made.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="card-name">Name on card</Label>
        <Input
          id="card-name"
          autoComplete="cc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={touched && name.trim().length < 2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="card-number">Card number</Label>
        <Input
          id="card-number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          value={card.number}
          onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
          aria-invalid={Boolean(show('number'))}
          aria-describedby="card-number-err"
        />
        {show('number') ? (
          <p id="card-number-err" role="alert" className="text-destructive text-sm">
            {show('number')}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="card-exp">Expiry (MM/YY)</Label>
          <Input
            id="card-exp"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="12/30"
            value={card.expiry}
            onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
            aria-invalid={Boolean(show('expiry'))}
          />
          {show('expiry') ? (
            <p role="alert" className="text-destructive text-sm">
              {show('expiry')}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="card-cvc">CVC</Label>
          <Input
            id="card-cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={card.cvc}
            onChange={(e) =>
              setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })
            }
            aria-invalid={Boolean(show('cvc'))}
          />
          {show('cvc') ? (
            <p role="alert" className="text-destructive text-sm">
              {show('cvc')}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setName('Ibrahim Musa');
            setCard({ number: TEST_CARDS.success, expiry: '12/40', cvc: '123' });
          }}
        >
          Use test card (succeeds)
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setName('Ibrahim Musa');
            setCard({ number: TEST_CARDS.declined, expiry: '12/40', cvc: '123' });
          }}
        >
          Use test card (declined)
        </Button>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        {label}
      </Button>
    </form>
  );
}
