import { Suspense } from 'react';

import { ListingSkeleton } from '@/components/listing/listing-skeleton';
import { ProductListing } from '@/components/listing/product-listing';

import type { SearchParams } from '@/lib/query';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drone accessories',
  description: 'Batteries, propellers, filters, cases, RTK and safety gear.',
};

export default async function AccessoriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <ProductListing
        searchParams={await searchParams}
        title="Shop Accessories"
        description="Batteries and chargers, flight and camera accessories, cases, safety gear and more."
        fixed={{ kind: 'accessory' }}
      />
    </Suspense>
  );
}
