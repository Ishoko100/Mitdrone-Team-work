import { FilterLinks, ManufacturerCard } from '@/components/directory/cards';
import { getManufacturers } from '@/lib/data';

import type { Metadata } from 'next';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Manufacturer directory',
  description:
    'Drone manufacturers from Nigeria and around the world: capabilities, industries served and verification status.',
};

export default async function ManufacturersPage({
  searchParams,
}: {
  searchParams: Promise<{ nigerian?: string }>;
}) {
  const { nigerian } = await searchParams;
  const only = nigerian === 'true';
  const result = await getManufacturers({ pageSize: 50, ...(only ? { nigerian: true } : {}) });
  return (
    <div className="container space-y-6 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {only ? 'Nigerian drone manufacturers' : 'Manufacturer directory'}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Making Nigerian and African drone manufacturers more visible. Every profile shows
          capabilities, industries served and verification status.
        </p>
      </header>
      <FilterLinks
        param="nigerian"
        base="/manufacturers"
        current={only ? 'true' : undefined}
        items={[
          { label: 'All manufacturers', value: '' },
          { label: 'Nigerian manufacturers', value: 'true' },
        ]}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((m) => (
          <li key={m.id}>
            <ManufacturerCard manufacturer={m} />
          </li>
        ))}
      </ul>
    </div>
  );
}
