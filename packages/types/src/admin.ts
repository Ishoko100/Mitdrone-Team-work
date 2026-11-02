import type { CurrencyCode, ISODateString, Money } from './common';

export interface PlatformSettings {
  /** 0..1 default platform commission. Vendors may override. */
  defaultCommissionRate: number;
  /** 0..1 VAT applied at checkout. */
  taxRate: number;
  shippingFlatRate: Money;
  minimumPayout: Money;
  payoutSchedule: 'weekly' | 'biweekly' | 'monthly';
  currencies: CurrencyCode[];
  defaultCurrency: CurrencyCode;
  /** 0..1 share of a referred customer's first purchase paid as reward. */
  referralRewardRate: number;
  maintenanceMode: boolean;
  supportEmail: string;
  updatedAt: ISODateString;
  updatedBy?: string;
}
