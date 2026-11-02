import {
  CategoryTiles,
  DealsSection,
  EntryCards,
  FeaturedSection,
  Hero,
  LiveStrip,
  ManufacturerStrip,
  SellingSteps,
  ServicesSpotlight,
  TrustBar,
  VendorStrip,
} from '@/components/home/sections';
import {
  getCategories,
  getLiveSessions,
  getManufacturers,
  getProducts,
  getServices,
  getVendors,
} from '@/lib/data';
import { env } from '@/lib/env';
import { jsonLdString } from '@/lib/seo';

import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const [deals, featured, categories, services, live, manufacturers, vendors] = await Promise.all([
    getProducts({ deal: true, pageSize: 4 }),
    getProducts({ featured: true, kind: 'drone', pageSize: 8 }),
    getCategories(),
    getServices({ pageSize: 4 }),
    getLiveSessions(),
    getManufacturers({ nigerian: true, pageSize: 3 }),
    getVendors({ pageSize: 4 }),
  ]);

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Mitdrone',
    url: env.NEXT_PUBLIC_APP_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${env.NEXT_PUBLIC_APP_URL}/search?q={query}`,
      'query-input': 'required name=query',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(website) }}
      />
      <Hero />
      <EntryCards />
      <DealsSection products={deals.data} />
      <CategoryTiles categories={categories.filter((c) => c.group === 'drones')} />
      <FeaturedSection products={featured.data} />
      <ServicesSpotlight services={services.data} />
      <LiveStrip sessions={live.data} />
      <ManufacturerStrip manufacturers={manufacturers.data} />
      <VendorStrip vendors={vendors.data} />
      <SellingSteps />
      <TrustBar />
    </>
  );
}
