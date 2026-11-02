import { EmptyState } from '@mitdrone/ui';
import { Store } from 'lucide-react';
import { Suspense } from 'react';

import { FilterLinks, VENDOR_TYPE_LABELS, VendorCard } from '@/components/directory/cards';
import { ListingPagination } from '@/components/listing/sort-and-pagination';
import { getVendors } from '@/lib/data';

import type { SearchParams } from '@/lib/query';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verified sellers',
  description: 'Browse verified dealers, manufacturers, renters and service providers on Mitdrone.',
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : (sp[k] as string | undefined));
  const type = one('type');
  const page = Math.max(1, Number(one('page')) || 1);
  const result = await getVendors({
    page,
    pageSize: 12,
    ...(type ? { type } : {}),
    ...(one('q') ? { q: one('q') } : {}),
  });
  return (
    <div className="container space-y-6 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Verified sellers</h1>
        <p className="text-muted-foreground">
          Every seller on Mitdrone passes identity and business checks.
        </p>
      </header>
      <FilterLinks
        param="type"
        base="/vendors"
        current={type}
        items={[
          { label: 'All', value: '' },
          ...Object.entries(VENDOR_TYPE_LABELS).map(([value, label]) => ({ label, value })),
        ]}
      />
      {result.data.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No sellers found"
          description="Try a different seller type."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((v) => (
            <li key={v.id}>
              <VendorCard vendor={v} />
            </li>
          ))}
        </ul>
      )}
      <Suspense fallback={null}>
        <ListingPagination page={result.meta.page} totalPages={result.meta.totalPages} />
      </Suspense>
    </div>
  );
}
