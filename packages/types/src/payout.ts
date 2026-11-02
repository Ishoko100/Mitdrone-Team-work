import type { ID, ISODateString, Money, Timestamps } from './common';
import type { BankDetails } from './vendor';

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'on_hold';

export interface Payout extends Timestamps {
  id: ID;
  vendorId: ID;
  vendorName: string;
  amount: Money;
  fee: Money;
  status: PayoutStatus;
  bank: BankDetails;
  periodStart: ISODateString;
  periodEnd: ISODateString;
  processedBy?: ID;
  processedAt?: ISODateString;
  failureReason?: string;
}

export interface VendorBalance {
  vendorId: ID;
  available: Money;
  pending: Money;
  lifetimeEarnings: Money;
}
