import sanitizeHtml from 'sanitize-html';

import { env } from './env';

import type { Product, Vendor } from '@mitdrone/types';

export const SITE_NAME = 'Mitdrone';
export const absoluteUrl = (path: string): string =>
  new URL(path, env.NEXT_PUBLIC_APP_URL).toString();

/** Allowlist sanitizer for vendor-authored rich text (TipTap output). Never render raw HTML. */
export function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'ul',
      'ol',
      'li',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'a',
    ],
    allowedAttributes: { a: ['href', 'rel', 'target'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer nofollow',
        target: '_blank',
      }),
    },
  });
}

/** schema.org/Product. Prices are converted from kobo to naira. */
export function productJsonLd(product: Product, reviewCount = product.reviewCount) {
  const availability =
    product.inventory.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const condition = {
    new: 'NewCondition',
    used: 'UsedCondition',
    refurbished: 'RefurbishedCondition',
  }[product.condition];
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription,
    sku: product.inventory.sku,
    brand: { '@type': 'Brand', name: product.brand },
    image: product.images.map((image) => absoluteUrl(image.url)),
    url: absoluteUrl(`/products/${product.slug}`),
    itemCondition: `https://schema.org/${condition}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: product.price.currency,
      price: (product.price.amount / 100).toFixed(2),
      availability,
      url: absoluteUrl(`/products/${product.slug}`),
      ...(product.vendor ? { seller: { '@type': 'Organization', name: product.vendor.name } } : {}),
    },
    ...(reviewCount > 0
      ? {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount },
        }
      : {}),
  };
}

export function vendorJsonLd(vendor: Vendor) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: vendor.name,
    description: vendor.description,
    url: absoluteUrl(`/vendors/${vendor.slug}`),
    address: {
      '@type': 'PostalAddress',
      addressLocality: vendor.city,
      addressRegion: vendor.state,
      addressCountry: 'NG',
    },
    ...(vendor.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: vendor.rating,
            reviewCount: vendor.reviewCount,
          },
        }
      : {}),
  };
}

/** Serialises JSON-LD safely for a <script> tag (prevents </script> injection). */
export const jsonLdString = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, '\\u003c');
