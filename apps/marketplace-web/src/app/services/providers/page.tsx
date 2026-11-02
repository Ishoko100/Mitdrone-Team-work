import { BadgeCheck, MapPin } from 'lucide-react';
import Link from 'next/link';

import { RatingStars } from '@/components/product/rating-stars';
import { getServices } from '@/lib/data';

import type { VendorSummary } from '@mitdrone/types';
import type { Metadata } from 'next';

export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Drone operators and service providers',
  description: 'Find verified drone operators and the services they offer.',
};

export default async function ProvidersPage() {
  const { data } = await getServices({ pageSize: 100 });
  const byVendor = new Map<
    string,
    { vendor: VendorSummary; titles: string[]; states: Set<string> }
  >();
  for (const s of data) {
    if (!s.vendor) continue;
    const entry = byVendor.get(s.vendor.id) ?? {
      vendor: s.vendor,
      titles: [],
      states: new Set<string>(),
    };
    entry.titles.push(s.title);
    s.coverageStates.forEach((st) => entry.states.add(st));
    byVendor.set(s.vendor.id, entry);
  }
  const providers = [...byVendor.values()].sort((a, b) => b.vendor.rating - a.vendor.rating);
  return (
    <div className="container space-y-6 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Find a drone operator</h1>
        <p className="text-muted-foreground">
          Verified pilots and companies offering drone services.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map(({ vendor, titles, states }) => (
          <li key={vendor.id}>
            <Link
              href={`/vendors/${vendor.slug}`}
              className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-3 rounded-xl border p-5 transition-shadow"
            >
              <span className="flex items-center gap-1 text-lg font-semibold">
                {vendor.name}
                {vendor.verified ? (
                  <BadgeCheck className="text-primary size-4" aria-label="Verified" />
                ) : null}
              </span>
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <MapPin className="size-3.5" aria-hidden="true" />
                Covers {[...states].slice(0, 3).join(', ')}
                {states.size > 3 ? ` +${states.size - 3}` : ''}
              </span>
              <span className="text-muted-foreground text-sm">
                {titles.length} service{titles.length === 1 ? '' : 's'}:{' '}
                {titles.slice(0, 2).join(', ')}
                {titles.length > 2 ? '…' : ''}
              </span>
              <span className="mt-auto">
                <RatingStars rating={vendor.rating} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
