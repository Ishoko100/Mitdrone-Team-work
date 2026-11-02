import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from './constants';

import type { CurrencyCode, Money } from '@mitdrone/types';

/** Convert major units (₦1,500) to minor units (150000). */
export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function toMajor(minor: number): number {
  return minor / 100;
}

export function makeMoney(major: number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
  return { amount: toMinor(major), currency };
}

export function formatCurrency(
  minor: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toMajor(minor));
}

export function formatMoney(money: Money, locale: string = DEFAULT_LOCALE): string {
  return formatCurrency(money.amount, money.currency, locale);
}

/** Compact output (₦1.5M) for dashboards. */
export function formatCompactMoney(money: Money, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(toMajor(money.amount));
}

export function sumMoney(
  values: readonly Money[],
  currency: CurrencyCode = DEFAULT_CURRENCY,
): Money {
  return { amount: values.reduce((total, v) => total + v.amount, 0), currency };
}
