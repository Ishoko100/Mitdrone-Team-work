import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '../errors';
import { configureApiClient, api } from '../index';

const BASE = 'http://api.test/api/v1';

let lastInit: RequestInit | undefined;
let lastUrl: string | undefined;

const capturingFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  lastUrl = String(input);
  lastInit = init;
  return Response.json({ ok: true }, { status: 200 });
});

const errorFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
  return Response.json(
    { code: 'validation_error', message: 'Invalid input', status: 422, fieldErrors: { email: ['Invalid email'] } },
    { status: 422 },
  );
});

beforeEach(() => {
  lastUrl = undefined;
  lastInit = undefined;
  capturingFetch.mockClear();
  errorFetch.mockClear();
  configureApiClient({
    baseUrl: BASE,
    fetch: capturingFetch,
    getCsrfToken: () => 'test-csrf-token',
  });
});

describe('backend endpoints - HTTP method and path', () => {
  it('GET organizations list', async () => {
    await api.backend.organizations.list({ page: 1, limit: 10 });
    expect(lastUrl).toBe(`${BASE}/organizations?page=1&limit=10`);
    expect(lastInit?.method).toBe('GET');
  });

  it('GET organization detail encodes the id', async () => {
    await api.backend.organizations.detail('org-123');
    expect(lastUrl).toBe(`${BASE}/organizations/org-123`);
    expect(lastInit?.method).toBe('GET');
  });

  it('POST organization application serializes the body', async () => {
    await api.backend.organizations.apply({
      acceptedTerms: true,
      termsVersion: 'v1',
      name: 'ACME Drones',
      businessEmail: 'sales@acme.test',
      phone: '+2348000000000',
      ownerFullName: 'Ibrahim Musa',
      businessAddress: '12 Zaria Road',
      location: 'Kaduna',
      businessType: 'REGISTERED_COMPANY',
      businessRegistrationDetails: 'RC123456',
      productCategories: ['drones'],
      description: 'We sell drones',
      capabilities: ['SALES'],
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/organizations/applications`);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.businessType).toBe('REGISTERED_COMPANY');
    expect(body.capabilities).toEqual(['SALES']);
  });

  it('POST service provider application', async () => {
    await api.backend.organizations.applyAsServiceProvider({
      acceptedTerms: true,
      termsVersion: 'v1',
      name: 'Sky Services',
      businessEmail: 'ops@sky.test',
      phone: '+2348000000001',
      location: 'Lagos',
      serviceCoverage: 'Lagos, Abuja',
      providerType: 'COMPANY',
      serviceCategories: ['maintenance'],
      experience: '5 years',
      equipmentAndCapabilities: 'lifts and rigging',
      certificationsOrLicences: 'none',
      portfolio: 'previous projects',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/organizations/service-provider-applications`);
  });

  it('PATCH resubmit application includes expectedVersion', async () => {
    await api.backend.organizations.resubmitApplication('org-1', {
      acceptedTerms: true,
      termsVersion: 'v2',
      name: 'ACME Drones',
      businessEmail: 'sales@acme.test',
      phone: '+2348000000000',
      ownerFullName: 'Ibrahim Musa',
      businessAddress: '12 Zaria Road',
      location: 'Kaduna',
      businessType: 'INDIVIDUAL_SELLER',
      businessRegistrationDetails: 'RC123456',
      productCategories: ['drones'],
      description: 'Updated',
      capabilities: ['SALES', 'RENTALS'],
      expectedVersion: 2,
    });
    expect(lastInit?.method).toBe('PATCH');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/application`);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.expectedVersion).toBe(2);
  });

  it('POST add member to organization', async () => {
    await api.backend.organizations.addMember('org-1', {
      email: 'staff@acme.test',
      role: 'CATALOG',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/memberships`);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.role).toBe('CATALOG');
  });

  it('DELETE membership removes the user', async () => {
    await api.backend.organizations.removeMember('org-1', 'user-2');
    expect(lastInit?.method).toBe('DELETE');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/memberships/user-2`);
  });
});

describe('backend endpoints - org review (staff)', () => {
  it('GET org review queue with filters', async () => {
    await api.backend.orgReview.queue({
      page: 2,
      limit: 25,
      status: 'PENDING',
      kind: 'VENDOR',
    });
    expect(lastUrl).toBe(
      `${BASE}/admin/organizations?page=2&limit=25&status=PENDING&kind=VENDOR`,
    );
    expect(lastInit?.method).toBe('GET');
  });

  it('POST org review decision', async () => {
    await api.backend.orgReview.review('org-1', {
      expectedVersion: 1,
      reason: 'Documents verified',
      decision: 'APPROVE',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/admin/organizations/org-1/review`);
  });

  it('POST org suspend', async () => {
    await api.backend.orgReview.suspend('org-1', {
      expectedVersion: 1,
      reason: 'Policy violation',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/admin/organizations/org-1/suspend`);
  });
});

describe('backend endpoints - catalog', () => {
  it('GET catalog offers with mode filter', async () => {
    await api.backend.catalog.offers({ mode: 'RENTAL', page: 1, limit: 20 });
    expect(lastUrl).toBe(`${BASE}/catalog/offers?mode=RENTAL&page=1&limit=20`);
    expect(lastInit?.method).toBe('GET');
  });

  it('GET catalog products', async () => {
    await api.backend.catalog.products({ page: 1, limit: 20 });
    expect(lastUrl).toBe(`${BASE}/catalog/products?page=1&limit=20`);
    expect(lastInit?.method).toBe('GET');
  });

  it('GET offer availability with date range', async () => {
    await api.backend.catalog.availability('offer-1', {
      startsAt: '2026-11-01T00:00:00Z',
      endsAt: '2026-11-07T00:00:00Z',
    });
    expect(lastUrl).toBe(
      `${BASE}/catalog/offers/offer-1/availability?startsAt=2026-11-01T00%3A00%3A00Z&endsAt=2026-11-07T00%3A00%3A00Z`,
    );
    expect(lastInit?.method).toBe('GET');
  });
});

describe('backend endpoints - vendor offers', () => {
  it('GET vendor offers list', async () => {
    await api.backend.vendorOffers.list('org-1', {
      page: 1,
      limit: 20,
      status: 'PUBLISHED',
    });
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/offers?page=1&limit=20&status=PUBLISHED`,
    );
    expect(lastInit?.method).toBe('GET');
  });

  it('POST create offer', async () => {
    await api.backend.vendorOffers.create('org-1', {
      productId: '550e8400-e29b-41d4-a716-446655440000',
      mode: 'SALE',
      amountMinor: '15000000',
      currency: { pattern: '^[A-Z]{3}$' },
      rateUnit: 'each',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/offers`);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.mode).toBe('SALE');
    expect(body.amountMinor).toBe('15000000');
  });

  it('PATCH update offer with expectedVersion', async () => {
    await api.backend.vendorOffers.update('org-1', 'offer-1', {
      productId: '550e8400-e29b-41d4-a716-446655440000',
      mode: 'RENTAL',
      amountMinor: null,
      currency: {},
      rateUnit: 'day',
      expectedVersion: 3,
    });
    expect(lastInit?.method).toBe('PATCH');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/offers/offer-1`);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.expectedVersion).toBe(3);
  });

  it('POST submit offer', async () => {
    await api.backend.vendorOffers.submit('org-1', 'offer-1', {
      expectedVersion: 1,
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/offers/offer-1/submit`);
  });

  it('POST archive offer', async () => {
    await api.backend.vendorOffers.archive('org-1', 'offer-1', {
      expectedVersion: 1,
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/offers/offer-1/archive`);
  });
});

describe('backend endpoints - inventory', () => {
  it('POST initialize stock', async () => {
    await api.backend.inventory.initializeStock('org-1', 'offer-1', {
      kind: 'QUANTITY',
      initialOnHand: 10,
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/offers/offer-1/stock`,
    );
    const body = JSON.parse(String(lastInit?.body));
    expect(body.kind).toBe('QUANTITY');
    expect(body.initialOnHand).toBe(10);
  });

  it('GET stock', async () => {
    await api.backend.inventory.getStock('org-1', 'offer-1');
    expect(lastInit?.method).toBe('GET');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/offers/offer-1/stock`);
  });

  it('POST adjust stock', async () => {
    await api.backend.inventory.adjustStock('org-1', 'offer-1', {
      expectedVersion: 1,
      delta: -2,
      reason: 'Sale',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/offers/offer-1/stock/adjustments`,
    );
  });

  it('PUT rental terms', async () => {
    await api.backend.inventory.configureRentalTerms('org-1', 'offer-1', {
      preparationMinutes: 30,
      returnBufferMinutes: 60,
      minimumDurationMinutes: 60,
      maximumDurationMinutes: 10080,
      expectedVersion: 1,
    });
    expect(lastInit?.method).toBe('PUT');
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/offers/offer-1/rental-terms`,
    );
  });

  it('GET rental terms', async () => {
    await api.backend.inventory.getRentalTerms('org-1', 'offer-1');
    expect(lastInit?.method).toBe('GET');
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/offers/offer-1/rental-terms`,
    );
  });

  it('POST create asset', async () => {
    await api.backend.inventory.createAsset('org-1', {
      productId: '550e8400-e29b-41d4-a716-446655440000',
      serialNumber: 'SN123456',
      conditionNote: 'Like new',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/assets`);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.serialNumber).toBe('SN123456');
  });

  it('GET list assets with status filter', async () => {
    await api.backend.inventory.listAssets('org-1', {
      page: 1,
      limit: 20,
      status: 'AVAILABLE',
    });
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/assets?page=1&limit=20&status=AVAILABLE`,
    );
  });

  it('PATCH update asset', async () => {
    await api.backend.inventory.updateAsset('org-1', 'asset-1', {
      expectedVersion: 1,
      status: 'MAINTENANCE',
      conditionNote: 'Needs service',
      reason: 'Scheduled maintenance',
    });
    expect(lastInit?.method).toBe('PATCH');
    expect(lastUrl).toBe(`${BASE}/organizations/org-1/assets/asset-1`);
  });

  it('POST block asset', async () => {
    await api.backend.inventory.blockAsset('org-1', 'asset-1', {
      startsAt: '2026-11-01T00:00:00Z',
      endsAt: '2026-11-02T00:00:00Z',
      reason: 'Maintenance',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/assets/asset-1/blocks`,
    );
  });

  it('DELETE release block', async () => {
    await api.backend.inventory.releaseBlock('org-1', 'asset-1', 'block-1');
    expect(lastInit?.method).toBe('DELETE');
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/assets/asset-1/blocks/block-1`,
    );
  });

  it('GET asset calendar with required dates', async () => {
    await api.backend.inventory.getAssetCalendar('org-1', 'asset-1', {
      startsAt: '2026-11-01T00:00:00Z',
      endsAt: '2026-11-30T00:00:00Z',
    });
    expect(lastUrl).toBe(
      `${BASE}/organizations/org-1/assets/asset-1/calendar?startsAt=2026-11-01T00%3A00%3A00Z&endsAt=2026-11-30T00%3A00%3A00Z`,
    );
  });
});

describe('backend endpoints - staff catalog', () => {
  it('POST staff create product', async () => {
    await api.backend.staffCatalog.createProduct({ name: 'DJI Mavic 3' });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/admin/products`);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.name).toBe('DJI Mavic 3');
  });

  it('GET staff offer queue', async () => {
    await api.backend.staffCatalog.offerQueue({
      page: 1,
      limit: 20,
      status: 'SUBMITTED',
    });
    expect(lastUrl).toBe(
      `${BASE}/admin/offers?page=1&limit=20&status=SUBMITTED`,
    );
  });

  it('POST staff review offer', async () => {
    await api.backend.staffCatalog.reviewOffer('offer-1', {
      expectedVersion: 1,
      reason: 'Approved',
      decision: 'APPROVE',
    });
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/admin/offers/offer-1/review`);
  });

  it('GET staff checkout terms', async () => {
    await api.backend.staffCatalog.getCheckoutTerms('offer-1');
    expect(lastInit?.method).toBe('GET');
    expect(lastUrl).toBe(`${BASE}/staff/offers/offer-1/checkout-terms`);
  });

  it('PUT staff checkout terms', async () => {
    await api.backend.staffCatalog.putCheckoutTerms('offer-1', {
      enabled: true,
      expectedOfferVersion: 1,
      expectedVersion: 1,
      rentalRounding: 'WHOLE_UNITS_ONLY',
      taxBasisPoints: 500,
      taxRounding: 'HALF_UP',
      deliveryFeeMinor: '5000',
      depositMinor: '100000',
      approvalReference: 'ref-123',
    });
    expect(lastInit?.method).toBe('PUT');
    expect(lastUrl).toBe(`${BASE}/staff/offers/offer-1/checkout-terms`);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.enabled).toBe(true);
    expect(body.taxRounding).toBe('HALF_UP');
  });
});

describe('backend endpoints - reservations', () => {
  it('GET reservations list', async () => {
    await api.backend.reservations.list({ page: 1, limit: 20 });
    expect(lastUrl).toBe(`${BASE}/reservations?page=1&limit=20`);
    expect(lastInit?.method).toBe('GET');
  });

  it('POST create reservation with idempotency key', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440000';
    await api.backend.reservations.create(
      {
        offerId: '550e8400-e29b-41d4-a716-446655440000',
        expectedOfferVersion: 1,
        quantity: 2,
      },
      key,
    );
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/reservations`);
    expect(new Headers(lastInit?.headers).get('Idempotency-Key')).toBe(key);
    expect(new Headers(lastInit?.headers).get('idempotency-key')).toBe(key);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.quantity).toBe(2);
  });

  it('POST create reservation generates key when none provided', async () => {
    await api.backend.reservations.create({
      offerId: '550e8400-e29b-41d4-a716-446655440000',
      expectedOfferVersion: 1,
      quantity: 1,
    });
    const header = new Headers(lastInit?.headers).get('Idempotency-Key');
    expect(header).toBeTruthy();
    expect(header).not.toBeNull();
    expect(/^[0-9a-f-]{36}$/i.test(header!)).toBe(true);
  });

  it('GET reservation detail', async () => {
    await api.backend.reservations.detail('res-1');
    expect(lastInit?.method).toBe('GET');
    expect(lastUrl).toBe(`${BASE}/reservations/res-1`);
  });

  it('POST release reservation', async () => {
    await api.backend.reservations.release('res-1');
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/reservations/res-1/release`);
  });

  it('GET checkout quote for reservation', async () => {
    await api.backend.reservations.checkoutQuote('res-1');
    expect(lastInit?.method).toBe('GET');
    expect(lastUrl).toBe(`${BASE}/reservations/res-1/checkout`);
  });
});

describe('backend endpoints - orders', () => {
  it('GET orders list', async () => {
    await api.backend.orders.list({ page: 1, limit: 20 });
    expect(lastUrl).toBe(`${BASE}/orders?page=1&limit=20`);
    expect(lastInit?.method).toBe('GET');
  });

  it('POST create order with idempotency key', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440001';
    await api.backend.orders.create(
      {
        reservationId: '550e8400-e29b-41d4-a716-446655440000',
        expectedCheckoutTermsVersion: 1,
        expectedTotalMinor: '15000000',
        currency: 'NGN',
      },
      key,
    );
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/orders`);
    expect(new Headers(lastInit?.headers).get('Idempotency-Key')).toBe(key);
    const body = JSON.parse(String(lastInit?.body));
    expect(body.expectedTotalMinor).toBe('15000000');
    expect(body.currency).toBe('NGN');
  });

  it('GET order detail', async () => {
    await api.backend.orders.detail('order-1');
    expect(lastInit?.method).toBe('GET');
    expect(lastUrl).toBe(`${BASE}/orders/order-1`);
  });

  it('POST cancel order', async () => {
    await api.backend.orders.cancel('order-1');
    expect(lastInit?.method).toBe('POST');
    expect(lastUrl).toBe(`${BASE}/orders/order-1/cancel`);
  });
});

describe('backend endpoints - health', () => {
  it('GET health live', async () => {
    await api.backend.health.live();
    expect(lastUrl).toBe('http://api.test/health/live');
    expect(lastInit?.method).toBe('GET');
  });

  it('GET health ready', async () => {
    await api.backend.health.ready();
    expect(lastUrl).toBe('http://api.test/health/ready');
    expect(lastInit?.method).toBe('GET');
  });
});

describe('backend endpoints - credentials and CSRF', () => {
  it('sends credentials: include on all requests', async () => {
    await api.backend.organizations.list();
    expect(lastInit?.credentials).toBe('include');
    await api.backend.catalog.offers();
    expect(lastInit?.credentials).toBe('include');
  });

  it('sends x-csrf-token on authenticated mutations', async () => {
    await api.backend.organizations.apply({
      acceptedTerms: true,
      termsVersion: 'v1',
      name: 'Test',
      businessEmail: 't@t.test',
      phone: '+2348000000000',
      ownerFullName: 'Test',
      businessAddress: 'Addr',
      location: 'Loc',
      businessType: 'INDIVIDUAL_SELLER',
      businessRegistrationDetails: 'Reg',
      productCategories: ['drones'],
      description: 'Desc',
      capabilities: ['SALES'],
    });
    expect(new Headers(lastInit?.headers).get('x-csrf-token')).toBe(
      'test-csrf-token',
    );
  });

  it('does not send x-csrf-token on GET requests', async () => {
    await api.backend.organizations.list();
    expect(new Headers(lastInit?.headers).get('x-csrf-token')).toBeNull();
  });

  it('fails closed when no CSRF token is configured on mutations', async () => {
    configureApiClient({ getCsrfToken: undefined });
    await expect(
      api.backend.organizations.apply({
        acceptedTerms: true,
        termsVersion: 'v1',
        name: 'Test',
        businessEmail: 't@t.test',
        phone: '+2348000000000',
        ownerFullName: 'Test',
        businessAddress: 'Addr',
        location: 'Loc',
        businessType: 'INDIVIDUAL_SELLER',
        businessRegistrationDetails: 'Reg',
        productCategories: ['drones'],
        description: 'Desc',
        capabilities: ['SALES'],
      }),
    ).rejects.toMatchObject({ code: 'csrf_token_unavailable' });
  });
});

describe('backend endpoints - API error parsing', () => {
  it('maps validation errors to ApiClientError with field errors', async () => {
    configureApiClient({ fetch: errorFetch });
    const error = await api.backend
      .organizations.apply({
        acceptedTerms: true,
        termsVersion: 'v1',
        name: 'Test',
        businessEmail: 'not-an-email',
        phone: '+2348000000000',
        ownerFullName: 'Test',
        businessAddress: 'Addr',
        location: 'Loc',
        businessType: 'INDIVIDUAL_SELLER',
        businessRegistrationDetails: 'Reg',
        productCategories: ['drones'],
        description: 'Desc',
        capabilities: ['SALES'],
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiClientError);
    if (error instanceof ApiClientError) {
      expect(error.status).toBe(422);
      expect(error.code).toBe('validation_error');
      expect(error.fieldErrors).toEqual({ email: ['Invalid email'] });
    }
  });

  it('GET health endpoints use auth: false', async () => {
    await api.backend.health.live();
    // The fetch should not include an Authorization header since auth is false
    expect(lastInit?.headers).not.toHaveProperty('Authorization');
  });
});
