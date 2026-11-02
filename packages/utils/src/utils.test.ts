import { describe, expect, it } from 'vitest';

import { toCsv } from './csv';
import { formatCurrency, makeMoney, toMinor } from './format-currency';
import { buildQueryString, groupBy, initials, truncate } from './helpers';
import { slugify } from './slugify';
import { isStrongPassword, isValidNigerianPhone } from './validators';

describe('currency', () => {
  it('converts major to minor units', () => {
    expect(toMinor(1500.5)).toBe(150050);
    expect(makeMoney(10).amount).toBe(1000);
  });
  it('formats naira', () => {
    const out = formatCurrency(150_000_00);
    expect(out).toContain('₦');
    expect(out).toContain('150,000');
  });
});

describe('slugify', () => {
  it('makes url-safe slugs', () => {
    expect(slugify('DJI Mavic 3 Enterprise')).toBe('dji-mavic-3-enterprise');
    expect(slugify('Batteries & Chargers')).toBe('batteries-and-chargers');
  });
});

describe('validators', () => {
  it('validates Nigerian phones', () => {
    expect(isValidNigerianPhone('08031234567')).toBe(true);
    expect(isValidNigerianPhone('+2348031234567')).toBe(true);
    expect(isValidNigerianPhone('12345')).toBe(false);
  });
  it('checks password strength', () => {
    expect(isStrongPassword('abc12345')).toBe(true);
    expect(isStrongPassword('abcdefgh')).toBe(false);
  });
});

describe('helpers', () => {
  it('builds query strings without empty values', () => {
    expect(buildQueryString({ q: 'dji', page: 2, empty: '', none: undefined })).toBe(
      '?q=dji&page=2',
    );
    expect(buildQueryString({})).toBe('');
  });
  it('groups, truncates and makes initials', () => {
    expect(groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even'))).toEqual({
      odd: [1, 3],
      even: [2, 4],
    });
    expect(truncate('abcdefghij', 5)).toBe('abcd…');
    expect(initials('Ibrahim Musa Bello')).toBe('IM');
  });
});

describe('csv', () => {
  it('exports rows and neutralises formula injection', () => {
    const csv = toCsv([{ name: '=HYPERLINK("x")', qty: 2 }], ['name', 'qty']);
    expect(csv.split(/\r?\n/)[0]).toBe('name,qty');
    expect(csv).toContain("'=HYPERLINK");
  });
});

describe('mock jwt', () => {
  it('round-trips payloads including unicode and detects expiry', async () => {
    const { encodeMockJwt, decodeJwt, isJwtExpired } = await import('./jwt');
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = encodeMockJwt({ sub: 'usr_1', name: 'Ọlá ₦', exp }, 'secret');
    expect(decodeJwt<{ sub: string; name: string }>(token)).toMatchObject({
      sub: 'usr_1',
      name: 'Ọlá ₦',
    });
    expect(isJwtExpired(token)).toBe(false);
    expect(isJwtExpired(encodeMockJwt({ exp: 1 }, 'secret'))).toBe(true);
    expect(decodeJwt('garbage')).toBeNull();
  });
});
