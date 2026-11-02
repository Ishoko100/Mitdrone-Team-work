import { Suspense } from 'react';

import { ListingSkeleton } from '@/components/listing/listing-skeleton';
import { ProductListing } from '@/components/listing/product-listing';

import type { SearchParams } from '@/lib/query';
import type { Metadata } from 'next';

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (await searchParams)['q'];
  const term = Array.isArray(q) ? q[0] : q;
  return {
    title: term ? `Results for “${term}”` : 'Shop drones, accessories and equipment',
    alternates: { canonical: '/products' },
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = Array.isArray(params['q']) ? params['q'][0] : params['q'];
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <ProductListing
        searchParams={params}
        title={q ? `Results for “${q}”` : 'All products'}
        description="Verified drones, accessories, payloads and spare parts from trusted sellers."
        defaults={{ listingType: 'sale' }}
      />
    </Suspense>
  );
}
