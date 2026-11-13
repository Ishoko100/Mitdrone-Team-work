import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assertIdempotencyHeaderPresent,
  clearIdempotencyKey,
  generateIdempotencyKey,
  getIdempotencyKey,
  idempotencyHeaders,
  isValidIdempotencyKey,
  newIdempotencyKey,
} from './idempotency';

describe('idempotency key generation', () => {
  it('generates a UUID v4 key', () => {
    const key = generateIdempotencyKey();
    expect(isValidIdempotencyKey(key)).toBe(true);
  });

  it('generates different keys for different calls', () => {
    const a = generateIdempotencyKey();
    const b = generateIdempotencyKey();
    expect(a).not.toBe(b);
  });

  it('rejects invalid keys', () => {
    expect(isValidIdempotencyKey('not-a-uuid')).toBe(false);
    expect(isValidIdempotencyKey(undefined)).toBe(false);
    expect(isValidIdempotencyKey('')).toBe(false);
  });
});

describe('idempotency key store', () => {
  beforeEach(() => {
    // Clear any leaked state between tests
    clearIdempotencyKey('reservation-create');
    clearIdempotencyKey('order-create');
  });

  it('returns the same key for the same operation (retry behavior)', () => {
    const first = getIdempotencyKey('reservation-create');
    const second = getIdempotencyKey('reservation-create');
    expect(first).toBe(second);
    expect(isValidIdempotencyKey(first)).toBe(true);
  });

  it('returns a new key when newIdempotencyKey is called', () => {
    const first = getIdempotencyKey('reservation-create');
    const replaced = newIdempotencyKey('reservation-create');
    expect(replaced).not.toBe(first);
    expect(getIdempotencyKey('reservation-create')).toBe(replaced);
  });

  it('returns different keys for different operations', () => {
    const a = getIdempotencyKey('reservation-create');
    const b = getIdempotencyKey('order-create');
    expect(a).not.toBe(b);
  });

  it('removes the key after clearIdempotencyKey', () => {
    getIdempotencyKey('reservation-create');
    clearIdempotencyKey('reservation-create');
    const after = getIdempotencyKey('reservation-create');
    expect(after).not.toBeUndefined();
    // A new key is generated after clearing
    expect(isValidIdempotencyKey(after)).toBe(true);
  });
});

describe('idempotency headers', () => {
  it('returns both header variants', () => {
    const key = '550e8400-e29b-41d4-a716-446655440000';
    const headers = idempotencyHeaders(key);
    expect(headers['Idempotency-Key']).toBe(key);
    expect(headers['idempotency-key']).toBe(key);
  });

  it('returns an empty object when no key is supplied', () => {
    expect(idempotencyHeaders(undefined)).toEqual({});
    expect(idempotencyHeaders('')).toEqual({});
  });
});

describe('assertIdempotencyHeaderPresent', () => {
  it('passes when the canonical header is present', () => {
    expect(() =>
      assertIdempotencyHeaderPresent({ 'Idempotency-Key': 'abc' }, 'abc'),
    ).not.toThrow();
  });

  it('passes when the lowercase variant is present', () => {
    expect(() =>
      assertIdempotencyHeaderPresent({ 'idempotency-key': 'abc' }, 'abc'),
    ).not.toThrow();
  });

  it('passes when both variants are present', () => {
    expect(() =>
      assertIdempotencyHeaderPresent(
        { 'Idempotency-Key': 'abc', 'idempotency-key': 'abc' },
        'abc',
      ),
    ).not.toThrow();
  });

  it('throws when no idempotency header is present but a key exists', () => {
    expect(() => assertIdempotencyHeaderPresent({}, 'abc')).toThrow(/Idempotency-Key header missing/);
  });

  it('passes when no key is supplied', () => {
    expect(() => assertIdempotencyHeaderPresent({})).not.toThrow();
  });

  it('uses vi.fn to verify no throw for valid input', () => {
    const fn = vi.fn(() => {
      assertIdempotencyHeaderPresent({ 'Idempotency-Key': 'abc' }, 'abc');
    });
    fn();
    expect(fn).toHaveBeenCalledOnce();
  });
});
