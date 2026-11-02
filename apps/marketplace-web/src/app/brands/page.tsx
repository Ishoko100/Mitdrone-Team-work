import Link from 'next/link';

import { ManufacturerCard } from '@/components/directory/cards';
import { getManufacturers } from '@/lib/data';

import type { Metadata } from 'next';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Brands',
  description: 'Shop drones and equipment by brand, including Nigerian manufacturers.',
};

export default async function BrandsPage() {
  const { data } = await getManufacturers({ pageSize: 50 });
  const popular = data.filter((m) => !m.isNigerian);
  const local = data.filter((m) => m.isNigerian);
  return (
    <div className="container space-y-12 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Brands</h1>
        <p className="text-muted-foreground">Shop by the brands you trust.</p>
      </header>
      <section aria-labelledby="popular" className="space-y-4">
        <h2 id="popular" className="text-xl font-semibold">
          Popular brands
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((m) => (
            <li key={m.id}>
              <ManufacturerCard manufacturer={m} base="/brands" />
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="local" className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 id="local" className="text-xl font-semibold">
            Nigerian manufacturers
          </h2>
          <Link
            href="/manufacturers?nigerian=true"
            className="text-primary text-sm font-medium hover:underline"
          >
            Manufacturer directory
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {local.map((m) => (
            <li key={m.id}>
              <ManufacturerCard manufacturer={m} base="/brands" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
