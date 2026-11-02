import { createSeed } from '@mitdrone/data';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductCard } from '@/components/product/product-card';
import { NAV_ITEMS, contentHref } from '@/lib/nav-config';
import { parseProductQuery, withParams } from '@/lib/query';
import { rentalQuote } from '@/lib/rental';
import { jsonLdString, productJsonLd, sanitizeDescription } from '@/lib/seo';
import { cartCount, cartSubtotal, lineKey, useCartStore } from '@/stores/cart';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element -- test double for next/image
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const seed = createSeed();
const product = seed.products.find((p) => p.title.startsWith('DJI Mavic 3 Enterprise'))!;
const line = {
  productId: 'p1',
  vendorId: 'v1',
  title: 'Drone',
  slug: 'drone',
  unitPrice: { amount: 100_000, currency: 'NGN' as const },
  maxQuantity: 3,
};

describe('cart store', () => {
  beforeEach(() => useCartStore.setState({ lines: [], hydrated: true }));

  it('adds, merges lines and caps at available stock', () => {
    const { add } = useCartStore.getState();
    expect(add(line, 2)).toEqual({ quantity: 2, capped: false });
    expect(add(line, 5)).toEqual({ quantity: 3, capped: true });
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(cartCount(useCartStore.getState().lines)).toBe(3);
    expect(cartSubtotal(useCartStore.getState().lines)).toBe(300_000);
  });

  it('keeps variants as separate lines and supports quantity changes and removal', () => {
    const { add, setQuantity, remove } = useCartStore.getState();
    add(line);
    add({ ...line, variantId: 'v-combo' });
    expect(useCartStore.getState().lines.map((l) => l.key)).toEqual([
      lineKey('p1'),
      lineKey('p1', 'v-combo'),
    ]);
    setQuantity(lineKey('p1'), 99);
    expect(useCartStore.getState().lines[0]?.quantity).toBe(3);
    setQuantity(lineKey('p1'), 0);
    expect(useCartStore.getState().lines).toHaveLength(1);
    remove(lineKey('p1', 'v-combo'));
    expect(useCartStore.getState().lines).toHaveLength(0);
  });
});

describe('URL query parsing', () => {
  it('parses valid params and drops invalid ones', () => {
    const q = parseProductQuery({
      q: 'dji',
      kind: 'drone',
      condition: 'bogus',
      minPrice: '100',
      maxPrice: 'abc',
      page: '3',
      sort: 'price_asc',
      deal: '1',
      onSale: 'true',
    });
    expect(q).toMatchObject({
      q: 'dji',
      kind: 'drone',
      minPrice: 100,
      page: 3,
      sort: 'price_asc',
      deal: true,
      onSale: true,
    });
    expect(q.condition).toBeUndefined();
    expect(q.maxPrice).toBeUndefined();
  });
  it('clamps page and ignores negative numbers', () => {
    expect(parseProductQuery({ page: '-4', minPrice: '-1' })).toMatchObject({ page: 1 });
    expect(parseProductQuery({ minPrice: '-1' }).minPrice).toBeUndefined();
  });
  it('withParams updates, removes and resets page', () => {
    expect(withParams('q=a&page=3', { brand: 'DJI' })).toBe('?q=a&brand=DJI');
    expect(withParams('q=a&page=3', { page: 2 })).toBe('?q=a&page=2');
    expect(withParams('q=a&brand=DJI', { brand: null, q: null })).toBe('');
  });
});

describe('navigation config', () => {
  const links = NAV_ITEMS.flatMap((i) => [
    ...(i.href ? [i.href] : []),
    ...(i.columns ?? []).flatMap((c) => c.links.map((l) => l.href)),
    ...(i.featured ? [i.featured.href] : []),
  ]);
  it('contains the nine top-level items from the brief, in order', () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      'Categories',
      'Shop',
      'Services',
      'Rent',
      'Accessories',
      'Brands',
      'Offers',
      'Sell',
      'More',
    ]);
  });
  it('has only internal absolute paths or full URLs, never empty or relative links', () => {
    for (const href of links) expect(href, href).toMatch(/^(\/|https?:\/\/)/);
  });
  it('category links point at real seeded categories', () => {
    const slugs = new Set(seed.categories.map((c) => c.slug));
    for (const href of links.filter((h) => h.startsWith('/categories/')))
      expect(slugs.has(href.replace('/categories/', '')), href).toBe(true);
  });
  it('service links point at real service categories and content links at real pages', () => {
    const services = new Set(seed.serviceCategories.map((c) => c.slug));
    for (const href of links.filter((h) => h.startsWith('/services?category=')))
      expect(services.has(href.split('=')[1] ?? ''), href).toBe(true);
    const pages = new Set(seed.contentPages.map((p) => contentHref(p.section, p.title)));
    for (const href of links.filter((h) =>
      /^\/(about|learn|trust-safety|business|support|compliance)\//.test(h),
    ))
      expect(pages.has(href), href).toBe(true);
  });
});

describe('SEO helpers', () => {
  it('builds valid Product JSON-LD with naira prices', () => {
    const ld = productJsonLd(product) as {
      offers: { price: string; priceCurrency: string };
      '@type': string;
    };
    expect(ld['@type']).toBe('Product');
    expect(ld.offers.priceCurrency).toBe('NGN');
    expect(ld.offers.price).toBe((product.price.amount / 100).toFixed(2));
  });
  it('escapes script-breaking characters in JSON-LD', () => {
    expect(jsonLdString({ a: '</script><script>alert(1)</script>' })).not.toContain('</script>');
  });
  it('sanitises vendor HTML', () => {
    const out = sanitizeDescription(
      '<p onclick="x()">Hi <script>alert(1)</script><a href="javascript:alert(1)">bad</a><a href="https://ok.com">ok</a><img src=x onerror=y></p>',
    );
    expect(out).not.toMatch(/script|onclick|onerror|javascript:|<img/i);
    expect(out).toContain('href="https://ok.com"');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
  });
});

describe('rental pricing', () => {
  const rental = {
    daily: { amount: 100, currency: 'NGN' as const },
    weekly: { amount: 600, currency: 'NGN' as const },
    monthly: { amount: 2000, currency: 'NGN' as const },
    deposit: { amount: 0, currency: 'NGN' as const },
    minDays: 1,
  };
  it('uses the cheapest combination of rates', () => {
    expect(rentalQuote(rental, 3).total.amount).toBe(300);
    expect(rentalQuote(rental, 8)).toMatchObject({
      total: { amount: 700 },
      breakdown: '1 week + 1 day',
    });
    expect(rentalQuote(rental, 37)).toMatchObject({
      total: { amount: 2000 + 600 },
      breakdown: '1 month + 1 week',
    });
  });
});

describe('ProductCard', () => {
  it('shows vendor, discount and an add to cart action', () => {
    const deal = seed.products.find((p) => p.compareAtPrice && p.variants.length === 0)!;
    const vendor = seed.vendors.find((v) => v.id === deal.vendorId)!;
    render(
      <ProductCard
        product={{
          ...deal,
          vendor: {
            id: vendor.id,
            slug: vendor.slug,
            name: vendor.name,
            type: vendor.type,
            verified: true,
            rating: 4,
            city: vendor.city,
            state: vendor.state,
          },
        }}
      />,
    );
    expect(screen.getByRole('link', { name: deal.title })).toHaveAttribute(
      'href',
      `/products/${deal.slug}`,
    );
    expect(screen.getByText(vendor.name)).toBeInTheDocument();
    expect(screen.getByText(/Save 10%/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeEnabled();
  });
});
