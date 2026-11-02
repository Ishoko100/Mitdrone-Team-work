/**
 * MOCK PAYMENTS. No card data leaves the browser and nothing is charged.
 * With a real Stripe test key the app renders Stripe Elements and passes the resulting
 * { last4, brand } to the confirm endpoint. With the mock key it renders a fallback card form
 * validated here. Test cards: 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 is declined.
 */
export const MOCK_STRIPE_KEY_PREFIX = 'pk_test_mitdrone';
export const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
} as const;

export const isMockStripeKey = (key: string | undefined): boolean =>
  !key || key.startsWith(MOCK_STRIPE_KEY_PREFIX);

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'verve' | 'unknown';

const digitsOnly = (value: string): string => value.replace(/\D/g, '');

export function detectCardBrand(number: string): CardBrand {
  const n = digitsOnly(number);
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^(5060|5061|5078|5079|6500)/.test(n)) return 'verve';
  return 'unknown';
}

export function luhnValid(number: string): boolean {
  const n = digitsOnly(number);
  if (n.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let digit = Number(n[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(value: string): string {
  const n = digitsOnly(value).slice(0, 19);
  return (
    detectCardBrand(n) === 'amex'
      ? n.replace(/^(\d{0,4})(\d{0,6})(\d{0,5}).*/, (_m, a: string, b: string, c: string) =>
          [a, b, c].filter(Boolean).join(' '),
        )
      : n.replace(/(\d{4})(?=\d)/g, '$1 ')
  ).trim();
}

export function parseExpiry(value: string): { month: number; year: number } | null {
  const match = /^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[1]);
  const rawYear = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { month, year: rawYear < 100 ? 2000 + rawYear : rawYear };
}

export function isExpiryValid(value: string, now: Date = new Date()): boolean {
  const parsed = parseExpiry(value);
  if (!parsed) return false;
  const endOfMonth = new Date(parsed.year, parsed.month, 0, 23, 59, 59);
  return endOfMonth.getTime() >= now.getTime();
}

export interface CardInput {
  number: string;
  expiry: string;
  cvc: string;
}
export interface CardValidation {
  valid: boolean;
  brand: CardBrand;
  last4: string;
  errors: Partial<Record<keyof CardInput, string>>;
}

export function validateCard(card: CardInput, now: Date = new Date()): CardValidation {
  const brand = detectCardBrand(card.number);
  const errors: CardValidation['errors'] = {};
  if (!luhnValid(card.number)) errors.number = 'Enter a valid card number';
  if (!isExpiryValid(card.expiry, now)) errors.expiry = 'Enter a valid expiry (MM/YY)';
  const cvcLength = brand === 'amex' ? 4 : 3;
  if (!new RegExp(`^\\d{${cvcLength}}$`).test(card.cvc))
    errors.cvc = `Enter the ${cvcLength}-digit code`;
  return {
    valid: Object.keys(errors).length === 0,
    brand,
    last4: digitsOnly(card.number).slice(-4),
    errors,
  };
}

/** What the confirm endpoint receives. The raw card number is never sent. */
export function toPaymentMethod(card: Pick<CardInput, 'number'>): { last4: string; brand: string } {
  return { last4: digitsOnly(card.number).slice(-4), brand: detectCardBrand(card.number) };
}
