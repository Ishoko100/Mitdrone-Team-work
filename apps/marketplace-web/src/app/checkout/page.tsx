import { CheckoutGuard } from '@/components/checkout/checkout-guard';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      <CheckoutGuard />
    </div>
  );
}
