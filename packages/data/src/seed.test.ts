import { describe, expect, it } from 'vitest';

import { DEMO_ACCOUNTS } from './constants';
import { createSeed } from './seed';

describe('seed data', () => {
  const seed = createSeed();

  it('is deterministic', () => {
    expect(JSON.stringify(createSeed())).toBe(JSON.stringify(seed));
  });

  it('has unique ids and slugs', () => {
    for (const key of ['users', 'vendors', 'products', 'orders', 'categories'] as const) {
      const ids = seed[key].map((x) => x.id);
      expect(new Set(ids).size, key).toBe(ids.length);
    }
    const slugs = seed.products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has valid references', () => {
    const vendors = new Set(seed.vendors.map((v) => v.id));
    const categories = new Set(seed.categories.map((c) => c.id));
    const users = new Set(seed.users.map((u) => u.id));
    for (const p of seed.products) {
      expect(vendors.has(p.vendorId), p.title).toBe(true);
      for (const c of p.categoryIds) expect(categories.has(c), `${p.title}: ${c}`).toBe(true);
    }
    for (const o of seed.orders) {
      expect(users.has(o.customerId)).toBe(true);
      for (const item of o.items) expect(vendors.has(item.vendorId)).toBe(true);
    }
    for (const a of DEMO_ACCOUNTS)
      expect(
        seed.users.some((u) => u.email === a.email),
        a.email,
      ).toBe(true);
  });

  it('order totals add up', () => {
    for (const o of seed.orders) {
      const sub = o.items.reduce((s, i) => s + i.total.amount, 0);
      expect(o.subtotal.amount).toBe(sub);
      expect(o.total.amount).toBe(sub + o.shipping.amount + o.tax.amount - o.discount.amount);
    }
  });

  it('vendor balances are never negative', () => {
    for (const b of seed.balances) expect(b.available.amount).toBeGreaterThanOrEqual(0);
  });

  it('covers the moderation and approval demo states', () => {
    expect(seed.vendors.some((v) => v.status === 'pending_review')).toBe(true);
    expect(seed.products.some((p) => p.status === 'pending_review')).toBe(true);
    expect(seed.products.some((p) => p.status === 'flagged')).toBe(true);
    expect(seed.products.some((p) => p.listingType === 'rent')).toBe(true);
    expect(seed.manufacturers.filter((m) => m.isNigerian).length).toBeGreaterThanOrEqual(3);
  });
});
