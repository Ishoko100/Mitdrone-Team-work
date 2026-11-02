import {
  getCategories,
  getContentPages,
  getManufacturers,
  getProducts,
  getServices,
  getVendors,
} from '@/lib/data';
import { contentHref } from '@/lib/nav-config';
import { absoluteUrl } from '@/lib/seo';

import type { MetadataRoute } from 'next';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, vendors, manufacturers, services, pages] = await Promise.all([
    getCategories(),
    getProducts({ pageSize: 100 }),
    getVendors({ pageSize: 100 }),
    getManufacturers({ pageSize: 50 }),
    getServices({ pageSize: 100 }),
    getContentPages(),
  ]);
  const entry = (
    path: string,
    priority: number,
    changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly',
    lastModified?: string,
  ) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
    ...(lastModified ? { lastModified } : {}),
  });
  return [
    ...[
      '/',
      '/products',
      '/offers',
      '/accessories',
      '/shop',
      '/rent',
      '/services',
      '/services/find',
      '/vendors',
      '/manufacturers',
      '/brands',
      '/live',
      '/sell',
      '/sell/how-it-works',
      '/referral',
    ].map((p) => entry(p, p === '/' ? 1 : 0.8, 'daily')),
    ...categories.map((c) => entry(`/categories/${c.slug}`, 0.6)),
    ...products.data.map((p) => entry(`/products/${p.slug}`, 0.7, 'weekly', p.updatedAt)),
    ...vendors.data.map((v) => entry(`/vendors/${v.slug}`, 0.6)),
    ...manufacturers.data.flatMap((m) => [
      entry(`/manufacturers/${m.slug}`, 0.6),
      entry(`/brands/${m.slug}`, 0.6),
    ]),
    ...services.data.map((s) => entry(`/services/${s.slug}`, 0.6)),
    ...pages.map((p) => entry(contentHref(p.section, p.title), 0.4, 'monthly')),
  ];
}
