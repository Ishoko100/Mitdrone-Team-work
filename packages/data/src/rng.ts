import { faker } from '@faker-js/faker';

import type { Money } from '@mitdrone/types';

/** Fixed "now" so seed data is identical on every run and every machine. */
export const REF_NOW = new Date('2026-10-18T09:00:00.000Z');

export function seedFaker(): void {
  faker.seed(20261018);
  faker.setDefaultRefDate(REF_NOW);
}

export { faker };

export const daysAgo = (days: number, hours = 0): string =>
  new Date(REF_NOW.getTime() - days * 86_400_000 - hours * 3_600_000).toISOString();
export const daysAhead = (days: number): string => daysAgo(-days);
export const addHours = (iso: string, hours: number): string =>
  new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString();

export const pad = (n: number, width = 3): string => String(n).padStart(width, '0');
export const makeId = (prefix: string, n: number, width = 3): string =>
  `${prefix}_${pad(n, width)}`;

/** Naira (major units) to Money (kobo). */
export const naira = (amount: number): Money => ({
  amount: Math.round(amount * 100),
  currency: 'NGN',
});
export const kobo = (amount: number): Money => ({ amount: Math.round(amount), currency: 'NGN' });

/** Deterministic modulo pick that never returns undefined. */
export function at<T>(items: readonly T[], index: number): T {
  const item = items[((index % items.length) + items.length) % items.length];
  if (item === undefined) throw new Error('at(): empty array');
  return item;
}

export const round1 = (n: number): number => Math.round(n * 10) / 10;
