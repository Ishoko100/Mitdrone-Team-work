import { DEMO_ACCOUNTS, MOCK_PASSWORD } from '@mitdrone/data';
import { API_PREFIX, buildPath, routes } from '@mitdrone/types';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { server } from './node';

import { getDb, resetDb, setMockConfig } from './index';

const BASE = `http://api.test${API_PREFIX}`;
type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any -- loose test helper

async function call(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; headers?: Record<string, string> } = {},
) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      ...opts.headers,
    },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });
  const text = await res.text();
  return { status: res.status, json: (text ? JSON.parse(text) : null) as Json };
}

async function login(email: string): Promise<string> {
  const { json } = await call('POST', routes.auth.login, {
    body: { email, password: MOCK_PASSWORD },
  });
  return json['tokens'].accessToken as string;
}

beforeAll(() => {
  setMockConfig({ latency: false });
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => resetDb());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('auth', () => {
  it('logs in every demo account', async () => {
    for (const account of DEMO_ACCOUNTS) {
      const { status, json } = await call('POST', routes.auth.login, {
        body: { email: account.email, password: MOCK_PASSWORD },
      });
      expect(status, account.email).toBe(200);
      expect(json['user'].role).toBe(account.role);
    }
  });
  it('rejects bad credentials and requires a token', async () => {
    expect(
      (
        await call('POST', routes.auth.login, {
          body: { email: 'ibrahim@mitdrone.test', password: 'wrongpass1' },
        })
      ).status,
    ).toBe(401);
    expect((await call('GET', routes.auth.session)).status).toBe(401);
  });
});

describe('catalog', () => {
  it('filters, sorts and paginates products', async () => {
    const { json } = await call(
      'GET',
      `${routes.catalog.products}?kind=drone&sort=price_asc&pageSize=5`,
    );
    expect(json['data']).toHaveLength(5);
    const prices = (json['data'] as { price: { amount: number } }[]).map((p) => p.price.amount);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    expect(json['data'][0].vendor.name).toBeTruthy();
  });
  it('hides unapproved and unpublished data and never leaks bank details', async () => {
    const products = await call('GET', `${routes.catalog.products}?pageSize=100`);
    expect(products.json['data'].every((p: { status: string }) => p.status === 'active')).toBe(
      true,
    );
    const vendor = await call('GET', buildPath(routes.catalog.vendor, { slug: 'skynaija-drones' }));
    expect(vendor.json['bank']).toBeUndefined();
    expect(
      (await call('GET', buildPath(routes.catalog.vendor, { slug: 'newwave-aviation' }))).status,
    ).toBe(404);
  });
  it('searches across entity types', async () => {
    const { json } = await call('GET', `${routes.catalog.search}?q=mavic`);
    expect(json['products'].length).toBeGreaterThan(0);
  });
});

describe('checkout', () => {
  const address = {
    fullName: 'Ibrahim Musa',
    phone: '08031234567',
    line1: '12 Zaria Road',
    city: 'Zaria',
    state: 'Kaduna',
    country: 'NG',
  };
  async function firstProduct() {
    const { json } = await call('GET', `${routes.catalog.products}?kind=accessory&pageSize=1`);
    return json['data'][0] as {
      id: string;
      inventory: { quantity: number };
      price: { amount: number };
    };
  }

  it('quotes, pays and creates an order, decrementing stock', async () => {
    const token = await login('ibrahim@mitdrone.test');
    const product = await firstProduct();
    const items = [{ productId: product.id, quantity: 2 }];
    const quote = await call('POST', routes.checkout.quote, {
      body: { items, couponCode: 'WELCOME10' },
    });
    expect(quote.json['discount'].amount).toBeGreaterThan(0);
    const intent = await call('POST', routes.checkout.paymentIntent, {
      token,
      body: { items, shippingAddress: address },
    });
    expect(intent.status).toBe(201);
    const order = await call('POST', routes.checkout.confirm, {
      token,
      body: {
        items,
        shippingAddress: address,
        paymentIntentId: intent.json['id'],
        paymentMethod: { last4: '4242' },
      },
    });
    expect(order.status).toBe(201);
    expect(order.json['status']).toBe('paid');
    const after = await call('GET', buildPath(routes.catalog.product, { idOrSlug: product.id }));
    expect(after.json['inventory'].quantity).toBe(product.inventory.quantity - 2);
  });

  it('declines the 0002 test card and rejects over-selling', async () => {
    const token = await login('ibrahim@mitdrone.test');
    const product = await firstProduct();
    const items = [{ productId: product.id, quantity: 1 }];
    const intent = await call('POST', routes.checkout.paymentIntent, {
      token,
      body: { items, shippingAddress: address },
    });
    const declined = await call('POST', routes.checkout.confirm, {
      token,
      body: {
        items,
        shippingAddress: address,
        paymentIntentId: intent.json['id'],
        paymentMethod: { last4: '0002' },
      },
    });
    expect(declined.status).toBe(402);
    const drone = (await call('GET', `${routes.catalog.products}?kind=drone&pageSize=1`)).json[
      'data'
    ][0];
    const tooMany = await call('POST', routes.checkout.quote, {
      body: { items: [{ productId: drone.id, quantity: drone.inventory.quantity + 1 }] },
    });
    expect(tooMany.status).toBe(409);
    expect(tooMany.json['code']).toBe('insufficient_stock');
  });
});

describe('vendor scoping', () => {
  it('blocks access to another vendor and to non-vendors', async () => {
    const token = await login('vendor@mitdrone.test');
    expect(
      (await call('GET', buildPath(routes.seller.products, { vendorId: 'ven_01' }), { token }))
        .status,
    ).toBe(200);
    expect(
      (await call('GET', buildPath(routes.seller.products, { vendorId: 'ven_02' }), { token }))
        .json['code'],
    ).toBe('vendor_scope_violation');
    const customer = await login('ibrahim@mitdrone.test');
    expect(
      (
        await call('GET', buildPath(routes.seller.products, { vendorId: 'ven_01' }), {
          token: customer,
        })
      ).status,
    ).toBe(403);
  });

  it("returns only the vendor's own orders and items", async () => {
    const token = await login('vendor@mitdrone.test');
    const { json } = await call(
      'GET',
      `${buildPath(routes.seller.orders, { vendorId: 'ven_01' })}?pageSize=100`,
      { token },
    );
    expect(json['data'].length).toBeGreaterThan(0);
    for (const order of json['data'])
      for (const item of order.items) expect(item.vendorId).toBe('ven_01');
  });

  it('creates a product in pending_review, then admin approval publishes it with an audit entry', async () => {
    const vendorToken = await login('vendor@mitdrone.test');
    const form = {
      title: 'DJI Mini 4 Pro Spare Battery',
      shortDescription: 'Spare intelligent flight battery.',
      description: 'A genuine spare battery for the Mini 4 Pro.',
      kind: 'accessory',
      listingType: 'sale',
      condition: 'new',
      brand: 'DJI',
      categoryIds: ['cat_batteries-and-chargers'],
      priceMajor: 95000,
      sku: 'MD-NEW-1',
      quantity: 10,
      lowStockThreshold: 2,
      tags: [],
    };
    const createdRes = await call(
      'POST',
      buildPath(routes.seller.products, { vendorId: 'ven_01' }),
      { token: vendorToken, body: form },
    );
    expect(createdRes.status).toBe(201);
    expect(createdRes.json['status']).toBe('pending_review');
    const invalid = await call('POST', buildPath(routes.seller.products, { vendorId: 'ven_01' }), {
      token: vendorToken,
      body: { ...form, title: 'x' },
    });
    expect(invalid.status).toBe(422);

    const adminToken = await login('admin@mitdrone.test');
    const approved = await call(
      'POST',
      buildPath(routes.admin.productApprove, { id: createdRes.json['id'] }),
      { token: adminToken },
    );
    expect(approved.json['status']).toBe('active');
    const logs = await call('GET', `${routes.admin.auditLogs}?action=product.approve`, {
      token: adminToken,
    });
    expect(logs.json['data'][0].entityId).toBe(createdRes.json['id']);
  });

  it('enforces order status transitions', async () => {
    const token = await login('vendor@mitdrone.test');
    const { json } = await call(
      'GET',
      `${buildPath(routes.seller.orders, { vendorId: 'ven_01' })}?status=paid`,
      { token },
    );
    const order = json['data'][0];
    if (!order) return;
    const path = buildPath(routes.seller.orderStatus, { vendorId: 'ven_01', id: order.id });
    expect((await call('PATCH', path, { token, body: { status: 'delivered' } })).status).toBe(409);
    expect(
      (await call('PATCH', path, { token, body: { status: 'processing' } })).json['status'],
    ).toBe('processing');
  });
});

describe('admin', () => {
  it('approves a pending vendor and writes an audit log; support cannot', async () => {
    const supportToken = await login('support@mitdrone.test');
    const path = buildPath(routes.admin.vendorApprove, { id: 'ven_10' });
    expect((await call('POST', path, { token: supportToken, body: {} })).status).toBe(403);
    const token = await login('admin@mitdrone.test');
    const res = await call('POST', path, { token, body: {} });
    expect(res.json['status']).toBe('approved');
    const logs = await call('GET', `${routes.admin.auditLogs}?action=vendor.approve&q=NewWave`, {
      token,
    });
    expect(logs.json['data']).toHaveLength(1);
  });

  it('requires a reason to reject and restricts role changes to super admins', async () => {
    const token = await login('admin@mitdrone.test');
    expect(
      (
        await call('POST', buildPath(routes.admin.vendorReject, { id: 'ven_10' }), {
          token,
          body: {},
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await call('PATCH', buildPath(routes.admin.user, { id: 'usr_adm_03' }), {
          token,
          body: { role: 'admin' },
        })
      ).status,
    ).toBe(403);
    const superToken = await login('superadmin@mitdrone.test');
    expect(
      (
        await call('PATCH', buildPath(routes.admin.user, { id: 'usr_adm_03' }), {
          token: superToken,
          body: { role: 'admin' },
        })
      ).json['role'],
    ).toBe('admin');
  });

  it('resolving a dispute with a refund refunds the order', async () => {
    const token = await login('admin@mitdrone.test');
    const { json } = await call('GET', `${routes.admin.disputes}?status=open`, { token });
    const dispute = json['data'][0];
    const res = await call('POST', buildPath(routes.admin.disputeResolve, { id: dispute.id }), {
      token,
      body: { outcome: 'refund', resolution: 'Refund approved' },
    });
    expect(res.json['status']).toBe('resolved_refund');
    const order = await call('GET', buildPath(routes.admin.order, { id: dispute.orderId }), {
      token,
    });
    expect(order.json['order'].status).toBe('refunded');
  });
});

describe('error simulation', () => {
  it('honours x-mock-error', async () => {
    const res = await call('GET', routes.catalog.categories, {
      headers: { 'x-mock-error': '503' },
    });
    expect(res.status).toBe(503);
    expect(res.json['code']).toBe('simulated_error');
  });
});

describe('seed freshness', () => {
  it('keeps seeded data recent relative to the real clock, so deals and charts never go stale', async () => {
    const orders = getDb().orders;
    const newest = Math.max(...orders.map((o) => new Date(o.createdAt).getTime()));
    expect((Date.now() - newest) / 86_400_000).toBeLessThan(7);
    const deals = getDb().products.filter((p) => p.dealEndsAt);
    expect(deals.length).toBeGreaterThan(0);
    for (const p of deals) expect(new Date(p.dealEndsAt!).getTime()).toBeGreaterThan(Date.now());
    const res = await call('GET', `${routes.catalog.products}?deal=true`);
    expect(res.json['data'].length).toBe(deals.filter((p) => p.status === 'active').length);
  });
});
