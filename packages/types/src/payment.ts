import type { ID, ISODateString, Money, Timestamps } from './common';

export type PaymentStatus =
  'requires_payment_method' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface Payment extends Timestamps {
  id: ID;
  orderId: ID;
  amount: Money;
  status: PaymentStatus;
  method: 'card' | 'bank_transfer';
  last4?: string;
  brand?: string;
  /** Mock Stripe PaymentIntent id. */
  providerReference: string;
}

export interface PaymentIntent {
  id: ID;
  clientSecret: string;
  amount: Money;
  status: PaymentStatus;
}

export interface Commission {
  id: ID;
  orderId: ID;
  vendorId: ID;
  rate: number;
  gross: Money;
  amount: Money;
  net: Money;
}

export type LedgerEntryType = 'sale' | 'commission' | 'refund' | 'payout' | 'adjustment';

export interface LedgerEntry {
  id: ID;
  vendorId: ID;
  type: LedgerEntryType;
  /** Positive = credit to vendor, negative = debit. */
  amount: Money;
  balanceAfter: Money;
  referenceId?: ID;
  description: string;
  createdAt: ISODateString;
}
