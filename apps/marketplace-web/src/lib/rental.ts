import type { Money, RentalPricing } from '@mitdrone/types';

/** Cheapest combination of monthly, weekly and daily rates for a number of days (30/7/1). */
export function rentalQuote(
  rental: RentalPricing,
  days: number,
): { total: Money; breakdown: string } {
  const currency = rental.daily.currency;
  let remaining = Math.max(1, Math.floor(days));
  let amount = 0;
  const parts: string[] = [];
  if (rental.monthly && remaining >= 30) {
    const months = Math.floor(remaining / 30);
    amount += months * rental.monthly.amount;
    remaining -= months * 30;
    parts.push(`${months} month${months > 1 ? 's' : ''}`);
  }
  if (rental.weekly && remaining >= 7) {
    const weeks = Math.floor(remaining / 7);
    amount += weeks * rental.weekly.amount;
    remaining -= weeks * 7;
    parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
  }
  if (remaining > 0) {
    amount += remaining * rental.daily.amount;
    parts.push(`${remaining} day${remaining > 1 ? 's' : ''}`);
  }
  return { total: { amount, currency }, breakdown: parts.join(' + ') };
}
