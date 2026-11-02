import Link from 'next/link';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ListingSkeleton } from '@/components/listing/listing-skeleton';
import { ProductListing } from '@/components/listing/product-listing';
import { getManufacturer } from '@/lib/data';

import type { SearchParams } from '@/lib/query';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await getManufacturer((await params).slug);
  return {
    title: `${m.name} drones and equipment`,
    description: m.description,
    alternates: { canonical: `/brands/${m.slug}` },
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const m = await getManufacturer((await params).slug);
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <ProductListing
        searchParams={await searchParams}
        title={m.name}
        description={m.description}
        fixed={{ brand: m.name, listingType: 'sale' }}
        breadcrumb={
          <>
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Brands', href: '/brands' },
                { label: m.name },
              ]}
            />
            <p className="-mt-2 mb-4 text-sm">
              <Link className="text-primary hover:underline" href={`/manufacturers/${m.slug}`}>
                View manufacturer profile
              </Link>
            </p>
          </>
        }
      />
    </Suspense>
  );
}
