import { routes, type Review, type SearchResults } from '@mitdrone/types';
import { z } from 'zod';

import { getDb, nextId } from '../db';
import { created, includesText, notFound, paginate, readBody, requireUser, route } from '../http';
import {
  embedServiceVendor,
  embedVendor,
  filterProducts,
  publicVendor,
  sortNewest,
  sortProducts,
} from '../lib';

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(3),
  body: z.string().min(10, 'Tell us a little more'),
});

export const catalogHandlers = [
  route('get', routes.catalog.products, ({ url }) => {
    const db = getDb();
    const active = db.products.filter((p) => p.status === 'active');
    const filtered = filterProducts(db, active, url.searchParams);
    const sorted = sortProducts(filtered, url.searchParams.get('sort'));
    const page = paginate(sorted, url, 12);
    return { ...page, data: page.data.map((p) => embedVendor(db, p)) };
  }),

  route('get', routes.catalog.product, ({ params }) => {
    const db = getDb();
    const key = params['idOrSlug'];
    const product = db.products.find(
      (p) => (p.id === key || p.slug === key) && p.status === 'active',
    );
    if (!product) throw notFound('Product');
    return embedVendor(db, product);
  }),

  route('get', routes.catalog.productReviews, ({ params, url }) => {
    const db = getDb();
    const items = db.reviews.filter(
      (r) => r.targetType === 'product' && r.targetId === params['id'] && r.status === 'published',
    );
    return paginate(sortNewest(items), url, 10);
  }),

  route('post', routes.catalog.productReviews, async ({ params, request }) => {
    const user = requireUser(request, ['customer']);
    const db = getDb();
    const product = db.products.find((p) => p.id === params['id']);
    if (!product) throw notFound('Product');
    const input = await readBody(request, reviewSchema);
    const now = new Date().toISOString();
    const review: Review = {
      id: nextId('rev'),
      targetType: 'product',
      targetId: product.id,
      authorId: user.id,
      authorName: user.name,
      rating: input.rating as Review['rating'],
      title: input.title,
      body: input.body,
      verifiedPurchase: db.orders.some(
        (o) => o.customerId === user.id && o.items.some((i) => i.productId === product.id),
      ),
      helpfulCount: 0,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    };
    db.reviews.unshift(review);
    const own = db.reviews.filter((r) => r.targetType === 'product' && r.targetId === product.id);
    product.reviewCount = own.length;
    product.rating = Math.round((own.reduce((s, r) => s + r.rating, 0) / own.length) * 10) / 10;
    return created(review);
  }),

  route('get', routes.catalog.categories, ({ url }) => {
    const group = url.searchParams.get('group');
    return getDb().categories.filter((c) => !group || c.group === group);
  }),

  route('get', routes.catalog.vendors, ({ url }) => {
    const q = url.searchParams;
    const items = getDb().vendors.filter(
      (v) =>
        v.status === 'approved' &&
        (!q.get('type') || v.type === q.get('type')) &&
        (!q.get('state') || v.state === q.get('state')) &&
        includesText([v.name, v.description, v.city], q.get('q')),
    );
    const page = paginate(
      [...items].sort((a, b) => b.rating - a.rating),
      url,
      12,
    );
    return { ...page, data: page.data.map(publicVendor) };
  }),

  route('get', routes.catalog.vendor, ({ params }) => {
    const vendor = getDb().vendors.find(
      (v) => v.slug === params['slug'] && v.status === 'approved',
    );
    if (!vendor) throw notFound('Vendor');
    return publicVendor(vendor);
  }),

  route('get', routes.catalog.manufacturers, ({ url }) => {
    const q = url.searchParams;
    const items = getDb().manufacturers.filter(
      (m) =>
        (q.get('nigerian') !== 'true' || m.isNigerian) &&
        includesText([m.name, m.description, ...m.capabilities], q.get('q')),
    );
    return paginate(items, url, 24);
  }),

  route('get', routes.catalog.manufacturer, ({ params }) => {
    const manufacturer = getDb().manufacturers.find((m) => m.slug === params['slug']);
    if (!manufacturer) throw notFound('Manufacturer');
    return manufacturer;
  }),

  route('get', routes.catalog.search, ({ url }) => {
    const db = getDb();
    const q = url.searchParams.get('q')?.trim() ?? '';
    if (!q)
      return {
        products: [],
        vendors: [],
        manufacturers: [],
        services: [],
        categories: [],
      } satisfies SearchResults;
    const results: SearchResults = {
      products: filterProducts(
        db,
        db.products.filter((p) => p.status === 'active'),
        new URLSearchParams({ q }),
      )
        .slice(0, 8)
        .map((p) => embedVendor(db, p)),
      vendors: db.vendors
        .filter((v) => v.status === 'approved' && includesText([v.name, v.city], q))
        .slice(0, 4)
        .map(publicVendor),
      manufacturers: db.manufacturers
        .filter((m) => includesText([m.name, ...m.capabilities], q))
        .slice(0, 4),
      services: db.services
        .filter((s) => s.status === 'active' && includesText([s.title, s.description], q))
        .slice(0, 6)
        .map((s) => embedServiceVendor(db, s)),
      categories: db.categories.filter((c) => includesText([c.name], q)).slice(0, 6),
    };
    return results;
  }),
];
