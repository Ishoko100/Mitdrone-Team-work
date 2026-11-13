import { z } from 'zod';

import { getDb } from '../db';
import { notFound, readBody, route } from '../http';

const passthrough = z.object({}).passthrough();

/* ------------------------------------------------------------------ health */

export const healthHandlers = [
  route('get', '/health/live', () => ({ status: 'ok', service: 'mitdrone-backend' }), ''),
  route('get', '/health/ready', () => ({ status: 'ok', service: 'mitdrone-backend' }), ''),
];

/* ------------------------------------------------------- organizations */

export const organizationHandlers = [
  route('get', '/organizations', () => ({
    organizations: getDb().vendors.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      status: o.status,
      kind: o.type,
      createdAt: o.createdAt,
    })),
  })),

  route('get', '/organizations/:id', ({ params }) => {
    const org = getDb().vendors.find((o) => o.id === params.id);
    if (!org) throw notFound('Organization');
    return org;
  }),

  route('post', '/organizations/applications', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `org_${Date.now()}`, status: 'pending_review' };
  }),

  route('post', '/organizations/service-provider-applications', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `sp_${Date.now()}`, status: 'pending_review' };
  }),

  route('patch', '/organizations/:id/application', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, status: 'resubmitted' };
  }),

  route('patch', '/organizations/:id/service-provider-application', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, status: 'resubmitted' };
  }),

  route('post', '/organizations/:id/memberships', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `member_${Date.now()}` };
  }),

  route('delete', '/organizations/:id/memberships/:userId', () => {
    return undefined;
  }),
];

/* ------------------------------------------------------ admin org review */

export const orgReviewHandlers = [
  route('get', '/admin/organizations', ({ url }) => {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const orgs = getDb().vendors.filter((o) => o.status === 'pending_review');
    const start = (page - 1) * limit;
    return {
      organizations: orgs.slice(start, start + limit),
      meta: { page, limit, total: orgs.length, totalPages: Math.ceil(orgs.length / limit) },
    };
  }),

  route('post', '/admin/organizations/:id/review', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, status: 'reviewed' };
  }),

  route('post', '/admin/organizations/:id/suspend', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, status: 'suspended' };
  }),
];

/* ------------------------------------------------------------ catalog */

export const catalogBackendHandlers = [
  route('get', '/catalog/offers', ({ url }) => {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offers = getDb().products
      .filter((p) => p.status === 'active')
      .map((p) => ({
        id: p.id,
        organizationId: p.vendorId,
        productId: p.id,
        mode: 'SALE',
        amountMinor: p.price.amount.toString(),
        currency: p.price.currency,
        status: 'PUBLISHED',
        createdAt: p.createdAt,
      }));
    const start = (page - 1) * limit;
    return {
      offers: offers.slice(start, start + limit),
      meta: { page, limit, total: offers.length, totalPages: Math.ceil(offers.length / limit) },
    };
  }),

  route('get', '/catalog/offers/:offerId/availability', ({ params }) => {
    return { offerId: params.offerId, available: true, slots: [] };
  }),
];

/* ------------------------------------------------------- vendor offers */

export const vendorOfferHandlers = [
  route('get', '/organizations/:organizationId/offers', ({ params, url }) => {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offers = getDb().products
      .filter((p) => p.vendorId === params.organizationId)
      .map((p) => ({
        id: p.id,
        organizationId: p.vendorId,
        productId: p.id,
        mode: 'SALE',
        amountMinor: p.price.amount.toString(),
        currency: p.price.currency,
        status: 'PUBLISHED',
        createdAt: p.createdAt,
      }));
    const start = (page - 1) * limit;
    return {
      offers: offers.slice(start, start + limit),
      meta: { page, limit, total: offers.length, totalPages: Math.ceil(offers.length / limit) },
    };
  }),

  route('post', '/organizations/:organizationId/offers', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `offer_${Date.now()}`, status: 'DRAFT' };
  }),

  route('patch', '/organizations/:organizationId/offers/:id', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, organizationId: params.organizationId, status: 'UPDATED' };
  }),

  route('post', '/organizations/:organizationId/offers/:id/submit', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, organizationId: params.organizationId, status: 'SUBMITTED' };
  }),

  route('post', '/organizations/:organizationId/offers/:id/archive', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, organizationId: params.organizationId, status: 'ARCHIVED' };
  }),
];

/* ------------------------------------------------------ staff catalog */

export const staffCatalogHandlers = [
  route('post', '/admin/products', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `product_${Date.now()}`, status: 'pending_review' };
  }),

  route('get', '/admin/offers', ({ url }) => {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const offers = getDb().products.map((p) => ({
      id: p.id,
      organizationId: p.vendorId,
      productId: p.id,
      status: p.status.toUpperCase(),
      createdAt: p.createdAt,
    }));
    const start = (page - 1) * limit;
    return {
      offers: offers.slice(start, start + limit),
      meta: { page, limit, total: offers.length, totalPages: Math.ceil(offers.length / limit) },
    };
  }),

  route('post', '/admin/offers/:id/review', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, status: 'reviewed' };
  }),

  route('get', '/staff/offers/:offerId/checkout-terms', ({ params }) => {
    return {
      offerId: params.offerId,
      enabled: true,
      expectedOfferVersion: 1,
      expectedVersion: 1,
      taxBasisPoints: 0,
      taxRounding: 'HALF_UP',
      deliveryFeeMinor: '0',
      depositMinor: '0',
      rentalRounding: 'WHOLE_UNITS_ONLY',
      approvalReference: '',
    };
  }),

  route('put', '/staff/offers/:offerId/checkout-terms', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { offerId: params.offerId, updated: true };
  }),
];

/* ------------------------------------------------------------- inventory */

export const inventoryHandlers = [
  route('get', '/organizations/:organizationId/offers/:offerId/stock', ({ params }) => {
    return {
      organizationId: params.organizationId,
      offerId: params.offerId,
      kind: 'QUANTITY',
      onHand: 100,
      reserved: 0,
      available: 100,
    };
  }),

  route('post', '/organizations/:organizationId/offers/:offerId/stock', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `stock_${Date.now()}`, organizationId: '', offerId: '' };
  }),

  route(
    'post',
    '/organizations/:organizationId/offers/:offerId/stock/adjustments',
    async ({ params, request }) => {
      await readBody(request, passthrough);
      return { organizationId: params.organizationId, offerId: params.offerId, adjusted: true };
    },
  ),

  route(
    'get',
    '/organizations/:organizationId/offers/:offerId/rental-terms',
    ({ params }) => {
      return {
        organizationId: params.organizationId,
        offerId: params.offerId,
        preparationMinutes: 60,
        returnBufferMinutes: 120,
        minimumDurationMinutes: 60,
        maximumDurationMinutes: 525600,
        expectedVersion: 1,
      };
    },
  ),

  route(
    'put',
    '/organizations/:organizationId/offers/:offerId/rental-terms',
    async ({ params, request }) => {
      await readBody(request, passthrough);
      return { organizationId: params.organizationId, offerId: params.offerId, updated: true };
    },
  ),

  route('post', '/organizations/:organizationId/assets', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `asset_${Date.now()}`, organizationId: '' };
  }),

  route('get', '/organizations/:organizationId/assets', ({ params, url }) => {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const assets = getDb().products
      .filter((p) => p.vendorId === params.organizationId)
      .map((p) => ({
        id: p.id,
        organizationId: p.vendorId,
        productId: p.id,
        serialNumber: p.inventory.sku,
        status: p.status.toUpperCase(),
        createdAt: p.createdAt,
      }));
    const start = (page - 1) * limit;
    return {
      assets: assets.slice(start, start + limit),
      meta: { page, limit, total: assets.length, totalPages: Math.ceil(assets.length / limit) },
    };
  }),

  route('patch', '/organizations/:organizationId/assets/:id', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: params.id, organizationId: params.organizationId, updated: true };
  }),

  route('post', '/organizations/:organizationId/assets/:id/blocks', async ({ params, request }) => {
    await readBody(request, passthrough);
    return { id: `block_${Date.now()}`, assetId: params.id, status: 'blocked' };
  }),

  route('delete', '/organizations/:organizationId/assets/:id/blocks/:blockId', ({ params }) => {
    return { assetId: params.id, blockId: params.blockId, released: true };
  }),

  route('get', '/organizations/:organizationId/assets/:id/calendar', ({ params, url }) => {
    return {
      assetId: params.id,
      startsAt: url.searchParams.get('startsAt'),
      endsAt: url.searchParams.get('endsAt'),
      slots: [],
    };
  }),
];

/* -------------------------------------------------------- reservations */

export const reservationHandlers = [
  route('get', '/reservations', ({ url }) => {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    return {
      reservations: [],
      meta: { page, limit, total: 0, totalPages: 0 },
    };
  }),

  route('post', '/reservations', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `res_${Date.now()}`, status: 'held' };
  }),

  route('get', '/reservations/:id', ({ params }) => {
    return { id: params.id, status: 'held' };
  }),

  route('post', '/reservations/:id/release', ({ params }) => {
    return { id: params.id, status: 'released' };
  }),

  route('get', '/reservations/:id/checkout', ({ params }) => {
    return { reservationId: params.id, totalMinor: '0', currency: 'NGN' };
  }),
];

/* ------------------------------------------------------------- orders */

export const orderHandlers = [
  route('get', '/orders', ({ url }) => {
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const orders = getDb().orders.map((o) => ({
      id: o.id,
      customerId: o.customerId,
      totalMinor: o.total.amount.toString(),
      currency: o.total.currency,
      status: o.status,
      createdAt: o.createdAt,
    }));
    const start = (page - 1) * limit;
    return {
      orders: orders.slice(start, start + limit),
      meta: { page, limit, total: orders.length, totalPages: Math.ceil(orders.length / limit) },
    };
  }),

  route('post', '/orders', async ({ request }) => {
    await readBody(request, passthrough);
    return { id: `order_${Date.now()}`, status: 'pending' };
  }),

  route('get', '/orders/:id', ({ params }) => {
    const order = getDb().orders.find((o) => o.id === params.id);
    if (!order) throw notFound('Order');
    return order;
  }),

  route('post', '/orders/:id/cancel', ({ params }) => {
    return { id: params.id, status: 'cancelled' };
  }),
];

/** All backend-native mock handlers, for registration in the MSW handler list. */
export const backendHandlers = [
  ...healthHandlers,
  ...organizationHandlers,
  ...orgReviewHandlers,
  ...catalogBackendHandlers,
  ...vendorOfferHandlers,
  ...staffCatalogHandlers,
  ...inventoryHandlers,
  ...reservationHandlers,
  ...orderHandlers,
];
