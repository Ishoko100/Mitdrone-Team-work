import {
  CategoryTiles,
  DealsSection,
  EquipmentSection,
  AccessoriesSection,
  EntryCards,
  FeaturedSection,
  Hero,
  ManufacturerStrip,
  ServicesSpotlight,
  TrustBar,
  TrustedBrandsStrip,
} from '@/components/home/sections';
import {
  getBackendHealthLive,
  getCategories,
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
  const backendHealth = await getBackendHealthLive();
  const [deals, featured, equipment, accessories, categories, services, manufacturers] =
    await Promise.all([
      getProducts({ deal: true, pageSize: 5 }),
      getProducts({ featured: true, kind: 'drone', pageSize: 10 }),
      getProducts({ kind: 'equipment', pageSize: 5 }),
      getProducts({ kind: 'accessory', pageSize: 5 }),
      getCategories(),
      getServices({ pageSize: 4 }),
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
      <Hero backendHealth={backendHealth} />
      <EntryCards />
      <DealsSection products={deals.data} />
      <FeaturedSection products={featured.data} />
      <EquipmentSection products={equipment.data} />
      <AccessoriesSection products={accessories.data} />
      <CategoryTiles categories={categories.filter((c) => c.group === 'drones')} />
      <ServicesSpotlight services={services.data} />
      <TrustedBrandsStrip />
      <ManufacturerStrip manufacturers={manufacturers.data} />
      <TrustBar />
    </>
  );
}
