import type { Db } from './db';
import type {
  Customer,
  Order,
  Product,
  ProductSort,
  ServiceListing,
  User,
  Vendor,
  VendorSummary,
} from '@mitdrone/types';

export const summarize = (v: Vendor): VendorSummary => ({
  id: v.id,
  slug: v.slug,
  name: v.name,
  type: v.type,
  verified: v.verified,
  rating: v.rating,
  city: v.city,
  state: v.state,
});

export function embedVendor(db: Db, product: Product): Product {
  const vendor = db.vendors.find((v) => v.id === product.vendorId);
  return vendor ? { ...product, vendor: summarize(vendor) } : product;
}

export function embedServiceVendor(db: Db, service: ServiceListing): ServiceListing {
  const vendor = db.vendors.find((v) => v.id === service.vendorId);
  return vendor ? { ...service, vendor: summarize(vendor) } : service;
}

/** Public vendor responses never include bank details. */
export function publicVendor(vendor: Vendor): Vendor {
  const { bank: _bank, ...rest } = vendor;
  return rest;
}

export const isCustomer = (user: User): user is Customer => user.role === 'customer';

export function filterProducts(db: Db, items: Product[], q: URLSearchParams): Product[] {
  const text = q.get('q')?.toLowerCase();
  const category = q.get('category');
  const brand = q.get('brand')?.toLowerCase();
  const vendor = q.get('vendor');
  const minPrice = q.has('minPrice') ? Number(q.get('minPrice')) : undefined;
  const maxPrice = q.has('maxPrice') ? Number(q.get('maxPrice')) : undefined;
  const minRating = q.has('minRating') ? Number(q.get('minRating')) : undefined;
  const categoryId = category
    ? db.categories.find((c) => c.slug === category || c.id === category)?.id
    : undefined;
  const vendorId = vendor
    ? db.vendors.find((v) => v.slug === vendor || v.id === vendor)?.id
    : undefined;
  const now = Date.now();

  return items.filter((p) => {
    if (
      text &&
      ![p.title, p.brand, p.shortDescription, ...p.tags].some((s) => s.toLowerCase().includes(text))
    )
      return false;
    if (category && (!categoryId || !p.categoryIds.includes(categoryId))) return false;
    if (brand && p.brand.toLowerCase() !== brand) return false;
    if (vendor && p.vendorId !== vendorId) return false;
    for (const key of ['kind', 'listingType', 'condition'] as const) {
      const wanted = q.get(key);
      if (wanted && p[key] !== wanted) return false;
    }
    if (minPrice !== undefined && p.price.amount < minPrice) return false;
    if (maxPrice !== undefined && p.price.amount > maxPrice) return false;
    if (minRating !== undefined && p.rating < minRating) return false;
    if (q.get('onSale') === 'true' && !p.compareAtPrice) return false;
    if (q.get('featured') === 'true' && !p.featured) return false;
    if (q.get('deal') === 'true' && !(p.dealEndsAt && new Date(p.dealEndsAt).getTime() > now))
      return false;
    return true;
  });
}

export function sortProducts(items: Product[], sort: ProductSort | string | null): Product[] {
  const copy = [...items];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.price.amount - b.price.amount);
    case 'price_desc':
      return copy.sort((a, b) => b.price.amount - a.price.amount);
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'popular':
      return copy.sort((a, b) => b.salesCount - a.salesCount);
    default:
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const sortNewest = <T extends { createdAt: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/** Orders restricted to one vendor's items, with totals recomputed for that vendor. */
export function vendorView(order: Order, vendorId: string): Order {
  const items = order.items.filter((it) => it.vendorId === vendorId);
  const subtotal = items.reduce((s, it) => s + it.total.amount, 0);
  const share = order.subtotal.amount ? subtotal / order.subtotal.amount : 0;
  const tax = Math.round(order.tax.amount * share);
  const shipping = order.vendorIds.length
    ? Math.round(order.shipping.amount / order.vendorIds.length)
    : 0;
  const discount = Math.round(order.discount.amount * share);
  const currency = order.total.currency;
  return {
    ...order,
    items,
    vendorIds: [vendorId],
    subtotal: { amount: subtotal, currency },
    tax: { amount: tax, currency },
    shipping: { amount: shipping, currency },
    discount: { amount: discount, currency },
    total: { amount: subtotal + tax + shipping - discount, currency },
  };
}

export const COUNTED = ['paid', 'processing', 'shipped', 'delivered', 'completed'] as const;
export const isCounted = (o: Order): boolean => (COUNTED as readonly string[]).includes(o.status);

export function dailySeries(
  days: number,
  valueFor: (date: string) => number,
): { date: string; value: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    return { date, value: valueFor(date) };
  });
}
