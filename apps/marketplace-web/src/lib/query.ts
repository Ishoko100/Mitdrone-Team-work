import type { ProductQuery } from '@mitdrone/sdk';
import type { ProductCondition, ProductKind, ProductSort } from '@mitdrone/types';

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined): string | undefined =>
  (Array.isArray(value) ? value[0] : value) || undefined;
const num = (value: string | undefined): number | undefined => {
  const n = value === undefined ? NaN : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const oneOf = <T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | undefined =>
  (allowed as readonly string[]).includes(value ?? '') ? (value as T) : undefined;

export const KINDS: readonly ProductKind[] = [
  'drone',
  'accessory',
  'spare_part',
  'payload',
  'equipment',
];
export const CONDITIONS: readonly ProductCondition[] = ['new', 'used', 'refurbished'];
export const SORTS: readonly ProductSort[] = [
  'newest',
  'price_asc',
  'price_desc',
  'rating',
  'popular',
];
export const PAGE_SIZE = 12;

/** Validates untrusted URL params into an API query. Unknown or malformed values are dropped. */
export function parseProductQuery(params: SearchParams): ProductQuery {
  const query: ProductQuery = { pageSize: PAGE_SIZE };
  const set = <K extends keyof ProductQuery>(key: K, value: ProductQuery[K] | undefined) => {
    if (value !== undefined) query[key] = value;
  };
  set('q', first(params['q']));
  set('category', first(params['category']));
  set('brand', first(params['brand']));
  set('vendor', first(params['vendor']));
  set('kind', oneOf(first(params['kind']), KINDS));
  set('listingType', oneOf(first(params['listingType']), ['sale', 'rent'] as const));
  set('condition', oneOf(first(params['condition']), CONDITIONS));
  set('minPrice', num(first(params['minPrice'])));
  set('maxPrice', num(first(params['maxPrice'])));
  set('minRating', num(first(params['minRating'])));
  set('sort', oneOf(first(params['sort']), SORTS));
  set('page', Math.max(1, Math.floor(num(first(params['page'])) ?? 1)));
  if (first(params['onSale']) === 'true') query.onSale = true;
  if (first(params['featured']) === 'true') query.featured = true;
  if (['true', '1'].includes(first(params['deal']) ?? '')) query.deal = true;
  return query;
}

/** Returns "?a=1&b=2" after applying updates. null/undefined/'' removes a key. Resets page unless set. */
export function withParams(
  current: URLSearchParams | string,
  updates: Record<string, string | number | null | undefined>,
): string {
  const next = new URLSearchParams(typeof current === 'string' ? current : current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') next.delete(key);
    else next.set(key, String(value));
  }
  if (!('page' in updates)) next.delete('page');
  const qs = next.toString();
  return qs ? `?${qs}` : '';
}
