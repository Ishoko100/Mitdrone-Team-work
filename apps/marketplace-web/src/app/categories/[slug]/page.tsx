import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ListingSkeleton } from '@/components/listing/listing-skeleton';
import { ProductListing } from '@/components/listing/product-listing';
import { getCategories } from '@/lib/data';

import type { SearchParams } from '@/lib/query';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

async function findCategory(slug: string) {
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) notFound();
  return category;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await findCategory((await params).slug);
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await findCategory((await params).slug);
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <ProductListing
        searchParams={await searchParams}
        title={category.name}
        {...(category.description ? { description: category.description } : {})}
        fixed={{ category: category.slug }}
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Categories', href: '/products' },
              { label: category.name },
            ]}
          />
        }
      />
    </Suspense>
  );
}
