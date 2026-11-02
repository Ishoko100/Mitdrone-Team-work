import {
  productFormSchema,
  routes,
  type BulkActionRequest,
  type KYCDocumentType,
  type Order,
  type OrderStatus,
  type Product,
  type ServiceListing,
  type ServiceQuote,
  type VendorAnalytics,
  type VendorDashboardData,
  type VendorKYC,
} from '@mitdrone/types';
import { makeMoney, slugify } from '@mitdrone/utils';
import { z } from 'zod';

import { getDb, nextId, type Db } from '../db';
import {
  ApiError,
  created,
  includesText,
  notFound,
  paginate,
  readBody,
  requireVendor,
  route,
} from '../http';
import { dailySeries, isCounted, sortNewest, vendorView } from '../lib';

const bankSchema = z.object({
  bankName: z.string().min(2, 'Enter your bank'),
  accountName: z.string().min(2),
  accountNumber: z.string().regex(/^\d{10}$/, 'Account number must be 10 digits'),
});
const settingsSchema = z
  .object({
    name: z.string().min(2),
    description: z.string(),
    phone: z.string(),
    website: z.string(),
    city: z.string(),
    state: z.string(),
    returnPolicy: z.string(),
    handlingDays: z.coerce.number().int().min(0).max(30),
  })
  .partial();
const kycSchema = z
  .object({
    legalName: z.string().min(2),
    registrationNumber: z.string(),
    documents: z.array(
      z.object({
        type: z.enum([
          'cac_certificate',
          'government_id',
          'proof_of_address',
          'ncaa_permit',
          'tax_id',
        ]),
        fileName: z.string(),
      }),
    ),
  })
  .partial();
const statusSchema = z.object({
  status: z.enum([
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'refunded',
  ]),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  note: z.string().optional(),
});
const bulkSchema = z.object({ ids: z.array(z.string()).min(1), action: z.string() });
const inventorySchema = z.object({ quantity: z.coerce.number().int().min(0) });
const serviceSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  categoryId: z.string(),
  pricingModel: z.enum(['per_hectare', 'per_hour', 'per_project', 'quote']),
  startingPriceMajor: z.coerce.number().positive().optional(),
  coverageStates: z.array(z.string()).min(1),
});
const quoteSchema = z.object({
  priceMajor: z.coerce.number().positive(),
  message: z.string().min(10),
  estimatedDays: z.coerce.number().int().min(1),
});

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ['cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  completed: [],
  cancelled: [],
  refunded: [],
};

function vendorOrders(db: Db, vendorId: string): Order[] {
  return db.orders.filter((o) => o.vendorIds.includes(vendorId));
}

function applyTransition(
  order: Order,
  to: OrderStatus,
  extra: {
    trackingNumber?: string | undefined;
    carrier?: string | undefined;
    note?: string | undefined;
  },
): void {
  if (!NEXT[order.status].includes(to)) {
    throw new ApiError(
      409,
      'invalid_transition',
      `Cannot move an order from ${order.status} to ${to}`,
    );
  }
  if (to === 'shipped' && !(extra.trackingNumber ?? order.trackingNumber)) {
    throw new ApiError(422, 'validation_error', 'Add a tracking number before marking as shipped', {
      trackingNumber: ['Required'],
    });
  }
  const now = new Date().toISOString();
  order.status = to;
  order.updatedAt = now;
  if (extra.trackingNumber) order.trackingNumber = extra.trackingNumber;
  if (extra.carrier) order.carrier = extra.carrier;
  order.timeline.push({ status: to, at: now, ...(extra.note ? { note: extra.note } : {}) });
}

function sales(db: Db, vendorId: string, days: number) {
  const since = Date.now() - days * 86_400_000;
  return vendorOrders(db, vendorId)
    .filter((o) => isCounted(o) && new Date(o.createdAt).getTime() >= since)
    .flatMap((order) =>
      order.items.filter((i) => i.vendorId === vendorId).map((item) => ({ order, item })),
    );
}

function topProducts(rows: ReturnType<typeof sales>): VendorDashboardData['topProducts'] {
  const map = new Map<string, { title: string; units: number; revenue: number }>();
  for (const { item } of rows) {
    const cur = map.get(item.productId) ?? { title: item.title, units: 0, revenue: 0 };
    cur.units += item.quantity;
    cur.revenue += item.total.amount;
    map.set(item.productId, cur);
  }
  return [...map.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([productId, v]) => ({
      productId,
      title: v.title,
      units: v.units,
      revenue: { amount: v.revenue, currency: 'NGN' },
    }));
}

function ownProduct(db: Db, vendorId: string, id: string | undefined): Product {
  const product = db.products.find((p) => p.id === id && p.vendorId === vendorId);
  if (!product) throw notFound('Product');
  return product;
}

export const sellerHandlers = [
  route('get', routes.seller.dashboard, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const db = getDb();
    const rows = sales(db, vendor.id, 30);
    const revenue = rows.reduce((s, r) => s + r.item.total.amount, 0);
    const orders = new Set(rows.map((r) => r.order.id)).size;
    const body: VendorDashboardData = {
      revenue: { amount: revenue, currency: 'NGN' },
      orders,
      conversionRate: orders ? Math.round((orders / (orders * 28 + 40)) * 1000) / 10 : 0,
      salesSeries: dailySeries(30, (date) =>
        rows
          .filter((r) => r.order.createdAt.startsWith(date))
          .reduce((s, r) => s + r.item.total.amount, 0),
      ),
      topProducts: topProducts(rows),
    };
    return body;
  }),

  route('get', routes.seller.analytics, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const db = getDb();
    const range =
      (['7d', '30d', '90d'] as const).find((r) => r === ctx.url.searchParams.get('range')) ?? '30d';
    const days = Number.parseInt(range, 10);
    const rows = sales(db, vendor.id, days);
    const orderIds = new Set(rows.map((r) => r.order.id));
    const revenue = rows.reduce((s, r) => s + r.item.total.amount, 0);
    const byCategory = new Map<string, number>();
    for (const { item } of rows) {
      const product = db.products.find((p) => p.id === item.productId);
      const name = db.categories.find((c) => c.id === product?.categoryIds[0])?.name ?? 'Other';
      byCategory.set(name, (byCategory.get(name) ?? 0) + item.total.amount);
    }
    const ordersSeries = dailySeries(
      days,
      (d) =>
        new Set(rows.filter((r) => r.order.createdAt.startsWith(d)).map((r) => r.order.id)).size,
    );
    const body: VendorAnalytics = {
      range,
      revenueSeries: dailySeries(days, (d) =>
        rows
          .filter((r) => r.order.createdAt.startsWith(d))
          .reduce((s, r) => s + r.item.total.amount, 0),
      ),
      ordersSeries,
      visitsSeries: ordersSeries.map((p, i) => ({
        date: p.date,
        value: p.value * 23 + 30 + ((i * 7) % 25),
      })),
      conversionRate: orderIds.size
        ? Math.round((orderIds.size / (orderIds.size * 28 + 40 * (days / 30))) * 1000) / 10
        : 0,
      averageOrderValue: {
        amount: orderIds.size ? Math.round(revenue / orderIds.size) : 0,
        currency: 'NGN',
      },
      categoryBreakdown: [...byCategory.entries()].map(([name, value]) => ({ name, value })),
      topProducts: topProducts(rows),
    };
    return body;
  }),

  route('get', routes.seller.settings, (ctx) => requireVendor(ctx).vendor),

  route('patch', routes.seller.settings, async (ctx) => {
    const { vendor } = requireVendor(ctx, true);
    const { handlingDays, ...rest } = await readBody(ctx.request, settingsSchema);
    Object.assign(vendor, rest);
    if (handlingDays !== undefined) vendor.shipping = { ...vendor.shipping, handlingDays };
    vendor.updatedAt = new Date().toISOString();
    return vendor;
  }),

  /* ---- products */
  route('get', routes.seller.products, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const db = getDb();
    const q = ctx.url.searchParams;
    const items = db.products.filter(
      (p) =>
        p.vendorId === vendor.id &&
        (!q.get('status') || p.status === q.get('status')) &&
        (!q.get('kind') || p.kind === q.get('kind')) &&
        includesText([p.title, p.inventory.sku, p.brand], q.get('q')),
    );
    return paginate(sortNewest(items), ctx.url, 20);
  }),

  route('post', routes.seller.products, async (ctx) => {
    const { vendor } = requireVendor(ctx);
    if (vendor.status !== 'approved')
      throw new ApiError(
        403,
        'vendor_not_approved',
        'Your store must be approved before you can list products',
      );
    const db = getDb();
    const input = await readBody(ctx.request, productFormSchema);
    const now = new Date().toISOString();
    let slug = slugify(input.title);
    if (db.products.some((p) => p.slug === slug)) slug = `${slug}-${db.products.length + 1}`;
    const imageKind = input.kind === 'spare_part' ? 'part' : input.kind;
    const product: Product = {
      id: nextId('prd'),
      slug,
      title: input.title,
      shortDescription: input.shortDescription,
      description: input.description,
      kind: input.kind,
      listingType: input.listingType,
      condition: input.condition,
      status: 'pending_review',
      vendorId: vendor.id,
      brand: input.brand,
      categoryIds: input.categoryIds,
      images: [{ url: `/placeholders/${imageKind}-1.svg`, alt: input.title }],
      price: makeMoney(input.priceMajor),
      ...(input.compareAtPriceMajor
        ? { compareAtPrice: makeMoney(input.compareAtPriceMajor) }
        : {}),
      variants: [],
      inventory: {
        sku: input.sku,
        quantity: input.quantity,
        lowStockThreshold: input.lowStockThreshold,
        trackInventory: true,
        allowBackorder: false,
      },
      specs: { Brand: input.brand, Condition: input.condition },
      tags: input.tags,
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      featured: false,
      createdAt: now,
      updatedAt: now,
    };
    db.products.unshift(product);
    return created(product);
  }),

  route('get', routes.seller.product, (ctx) => {
    const { vendor } = requireVendor(ctx);
    return ownProduct(getDb(), vendor.id, ctx.params['id']);
  }),

  route('patch', routes.seller.product, async (ctx) => {
    const { vendor } = requireVendor(ctx);
    const product = ownProduct(getDb(), vendor.id, ctx.params['id']);
    const input = await readBody(ctx.request, productFormSchema.partial());
    const { priceMajor, compareAtPriceMajor, sku, quantity, lowStockThreshold, ...rest } = input;
    Object.assign(product, rest);
    if (priceMajor !== undefined) product.price = makeMoney(priceMajor);
    if (compareAtPriceMajor !== undefined) product.compareAtPrice = makeMoney(compareAtPriceMajor);
    if (sku !== undefined) product.inventory.sku = sku;
    if (quantity !== undefined) product.inventory.quantity = quantity;
    if (lowStockThreshold !== undefined) product.inventory.lowStockThreshold = lowStockThreshold;
    product.updatedAt = new Date().toISOString();
    return product;
  }),

  route('delete', routes.seller.product, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const db = getDb();
    const product = ownProduct(db, vendor.id, ctx.params['id']);
    db.products = db.products.filter((p) => p.id !== product.id);
    return undefined;
  }),

  route('post', routes.seller.productsBulk, async (ctx) => {
    const { vendor } = requireVendor(ctx);
    const db = getDb();
    const { ids, action } = (await readBody(ctx.request, bulkSchema)) as BulkActionRequest;
    const mine = db.products.filter((p) => p.vendorId === vendor.id && ids.includes(p.id));
    if (action === 'delete') db.products = db.products.filter((p) => !mine.includes(p));
    else if (action === 'archive') mine.forEach((p) => (p.status = 'archived'));
    else if (action === 'activate')
      mine.forEach((p) => (p.status = p.status === 'archived' ? 'pending_review' : p.status));
    else throw new ApiError(422, 'validation_error', `Unknown bulk action "${action}"`);
    return { affected: mine.length };
  }),

  /* ---- orders */
  route('get', routes.seller.orders, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const q = ctx.url.searchParams;
    const items = vendorOrders(getDb(), vendor.id)
      .filter(
        (o) =>
          (!q.get('status') || o.status === q.get('status')) &&
          includesText([o.number, o.customerName, o.customerEmail], q.get('q')),
      )
      .map((o) => vendorView(o, vendor.id));
    return paginate(sortNewest(items), ctx.url, 20);
  }),

  route('get', routes.seller.order, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const order = vendorOrders(getDb(), vendor.id).find((o) => o.id === ctx.params['id']);
    if (!order) throw notFound('Order');
    return vendorView(order, vendor.id);
  }),

  route('patch', routes.seller.orderStatus, async (ctx) => {
    const { vendor } = requireVendor(ctx);
    const order = vendorOrders(getDb(), vendor.id).find((o) => o.id === ctx.params['id']);
    if (!order) throw notFound('Order');
    const { status, ...extra } = await readBody(ctx.request, statusSchema);
    applyTransition(order, status, extra);
    return vendorView(order, vendor.id);
  }),

  route('post', routes.seller.ordersBulk, async (ctx) => {
    const { vendor } = requireVendor(ctx);
    const { ids, action } = await readBody(ctx.request, bulkSchema);
    const target: OrderStatus | undefined =
      action === 'process' ? 'processing' : action === 'cancel' ? 'cancelled' : undefined;
    if (!target) throw new ApiError(422, 'validation_error', `Unknown bulk action "${action}"`);
    let updated = 0;
    const failed: string[] = [];
    for (const order of vendorOrders(getDb(), vendor.id).filter((o) => ids.includes(o.id))) {
      try {
        applyTransition(order, target, {});
        updated += 1;
      } catch {
        failed.push(order.number);
      }
    }
    return { updated, failed };
  }),

  /* ---- inventory */
  route('get', routes.seller.inventory, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const q = ctx.url.searchParams;
    const items = getDb().products.filter(
      (p) =>
        p.vendorId === vendor.id &&
        p.status !== 'archived' &&
        includesText([p.title, p.inventory.sku], q.get('q')) &&
        (q.get('lowStock') !== 'true' || p.inventory.quantity <= p.inventory.lowStockThreshold),
    );
    return paginate(items, ctx.url, 20);
  }),

  route('patch', routes.seller.inventoryItem, async (ctx) => {
    const { vendor } = requireVendor(ctx);
    const product = ownProduct(getDb(), vendor.id, ctx.params['productId']);
    const { quantity } = await readBody(ctx.request, inventorySchema);
    product.inventory.quantity = quantity;
    product.updatedAt = new Date().toISOString();
    return product;
  }),

  /* ---- money */
  route('get', routes.seller.payouts, (ctx) => {
    const { vendor } = requireVendor(ctx);
    return paginate(
      sortNewest(getDb().payouts.filter((p) => p.vendorId === vendor.id)),
      ctx.url,
      20,
    );
  }),

  route('get', routes.seller.balance, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const zero = { amount: 0, currency: 'NGN' as const };
    return (
      getDb().balances.find((b) => b.vendorId === vendor.id) ?? {
        vendorId: vendor.id,
        available: zero,
        pending: zero,
        lifetimeEarnings: zero,
      }
    );
  }),

  route('get', routes.seller.ledger, (ctx) => {
    const { vendor } = requireVendor(ctx);
    return paginate(
      sortNewest(getDb().ledger.filter((l) => l.vendorId === vendor.id)),
      ctx.url,
      25,
    );
  }),

  route('put', routes.seller.bank, async (ctx) => {
    const { vendor } = requireVendor(ctx, true);
    vendor.bank = await readBody(ctx.request, bankSchema);
    vendor.updatedAt = new Date().toISOString();
    return vendor.bank;
  }),

  /* ---- KYC */
  route('get', routes.seller.kyc, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const db = getDb();
    const existing = db.kyc.find((k) => k.vendorId === vendor.id);
    if (existing) return existing;
    const now = new Date().toISOString();
    const blank: VendorKYC = {
      id: nextId('kyc'),
      vendorId: vendor.id,
      status: 'not_started',
      legalName: '',
      documents: [],
      createdAt: now,
      updatedAt: now,
    };
    db.kyc.push(blank);
    return blank;
  }),

  route('put', routes.seller.kyc, async (ctx) => {
    const { vendor } = requireVendor(ctx, true);
    const db = getDb();
    const input = await readBody(ctx.request, kycSchema);
    let kyc = db.kyc.find((k) => k.vendorId === vendor.id);
    const now = new Date().toISOString();
    if (!kyc) {
      kyc = {
        id: nextId('kyc'),
        vendorId: vendor.id,
        status: 'in_progress',
        legalName: '',
        documents: [],
        createdAt: now,
        updatedAt: now,
      };
      db.kyc.push(kyc);
    }
    if (input.legalName !== undefined) kyc.legalName = input.legalName;
    if (input.registrationNumber !== undefined) kyc.registrationNumber = input.registrationNumber;
    if (input.documents)
      kyc.documents = input.documents.map((d) => ({
        type: d.type as KYCDocumentType,
        fileName: d.fileName,
        url: '/placeholders/document.pdf',
        uploadedAt: now,
      }));
    if (kyc.status === 'not_started') kyc.status = 'in_progress';
    vendor.kycStatus = kyc.status;
    kyc.updatedAt = now;
    return kyc;
  }),

  route('post', routes.seller.kycSubmit, (ctx) => {
    const { vendor } = requireVendor(ctx, true);
    const kyc = getDb().kyc.find((k) => k.vendorId === vendor.id);
    if (!kyc || !kyc.legalName || kyc.documents.length < 2) {
      throw new ApiError(
        422,
        'validation_error',
        'Add your legal name and at least two documents before submitting',
      );
    }
    kyc.status = 'submitted';
    vendor.kycStatus = 'submitted';
    vendor.status = 'pending_review';
    kyc.updatedAt = vendor.updatedAt = new Date().toISOString();
    return kyc;
  }),

  /* ---- services and quotes */
  route('get', routes.seller.services, (ctx) => {
    const { vendor } = requireVendor(ctx);
    return paginate(
      sortNewest(getDb().services.filter((s) => s.vendorId === vendor.id)),
      ctx.url,
      20,
    );
  }),

  route('post', routes.seller.services, async (ctx) => {
    const { vendor } = requireVendor(ctx);
    if (vendor.status !== 'approved')
      throw new ApiError(
        403,
        'vendor_not_approved',
        'Your store must be approved before you can list services',
      );
    const input = await readBody(ctx.request, serviceSchema);
    const now = new Date().toISOString();
    const service: ServiceListing = {
      id: nextId('svc'),
      slug: slugify(input.title),
      title: input.title,
      description: input.description,
      categoryId: input.categoryId,
      vendorId: vendor.id,
      pricingModel: input.pricingModel,
      ...(input.startingPriceMajor ? { startingPrice: makeMoney(input.startingPriceMajor) } : {}),
      coverageStates: input.coverageStates,
      rating: 0,
      reviewCount: 0,
      verified: vendor.verified,
      status: 'pending_review',
      createdAt: now,
      updatedAt: now,
    };
    getDb().services.unshift(service);
    return created(service);
  }),

  route('get', routes.seller.serviceRequests, (ctx) => {
    const { vendor } = requireVendor(ctx);
    const db = getDb();
    const mine = new Set(
      db.services.filter((s) => s.vendorId === vendor.id).map((s) => s.categoryId),
    );
    const items = db.serviceRequests.filter((r) => r.status !== 'closed' && mine.has(r.categoryId));
    return paginate(sortNewest(items), ctx.url, 20);
  }),

  route('post', routes.seller.serviceQuote, async (ctx) => {
    const { vendor } = requireVendor(ctx);
    const db = getDb();
    const request = db.serviceRequests.find((r) => r.id === ctx.params['id']);
    if (!request) throw notFound('Project');
    if (db.serviceQuotes.some((q) => q.requestId === request.id && q.vendorId === vendor.id)) {
      throw new ApiError(409, 'duplicate_quote', 'You already sent a quote for this project');
    }
    const input = await readBody(ctx.request, quoteSchema);
    const now = new Date().toISOString();
    const quote: ServiceQuote = {
      id: nextId('sq'),
      requestId: request.id,
      vendorId: vendor.id,
      price: makeMoney(input.priceMajor),
      message: input.message,
      estimatedDays: input.estimatedDays,
      status: 'sent',
      createdAt: now,
      updatedAt: now,
    };
    db.serviceQuotes.push(quote);
    request.quoteCount += 1;
    request.status = 'quoted';
    return created(quote);
  }),
];
