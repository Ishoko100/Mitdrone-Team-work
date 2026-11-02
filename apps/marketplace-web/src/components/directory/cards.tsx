import { Badge } from '@mitdrone/ui';
import { BadgeCheck, Globe, MapPin } from 'lucide-react';
import Link from 'next/link';

import { RatingStars } from '@/components/product/rating-stars';

import type { Manufacturer, Vendor } from '@mitdrone/types';

export const VENDOR_TYPE_LABELS: Record<string, string> = {
  dealer: 'Dealer',
  manufacturer: 'Manufacturer',
  individual_seller: 'Individual seller',
  service_provider: 'Service provider',
  renter: 'Rental company',
};

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-3 rounded-xl border p-5 transition-shadow"
    >
      <span className="flex items-center gap-1 text-lg font-semibold">
        {vendor.name}
        {vendor.verified ? (
          <BadgeCheck className="text-primary size-4" aria-label="Verified seller" />
        ) : null}
      </span>
      <Badge variant="secondary" className="w-fit">
        {VENDOR_TYPE_LABELS[vendor.type] ?? vendor.type}
      </Badge>
      <span className="text-muted-foreground line-clamp-2 text-sm">{vendor.description}</span>
      <span className="text-muted-foreground mt-auto flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden="true" />
          {vendor.city}, {vendor.state}
        </span>
        <RatingStars rating={vendor.rating} count={vendor.reviewCount} />
      </span>
    </Link>
  );
}

export function ManufacturerCard({
  manufacturer,
  base = '/manufacturers',
}: {
  manufacturer: Manufacturer;
  base?: '/manufacturers' | '/brands';
}) {
  return (
    <Link
      href={`${base}/${manufacturer.slug}`}
      className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-3 rounded-xl border p-5 transition-shadow"
    >
      <span className="flex items-center gap-1 text-lg font-semibold">
        {manufacturer.name}
        {manufacturer.verified ? (
          <BadgeCheck className="text-primary size-4" aria-label="Verified manufacturer" />
        ) : null}
      </span>
      <span className="text-muted-foreground flex items-center gap-2 text-xs">
        <Globe className="size-3.5" aria-hidden="true" />
        {manufacturer.country}
        {manufacturer.isNigerian ? <Badge variant="success">Nigerian</Badge> : null}
      </span>
      <span className="text-muted-foreground line-clamp-2 text-sm">{manufacturer.description}</span>
      <span className="mt-auto flex flex-wrap gap-1">
        {manufacturer.capabilities.slice(0, 3).map((c) => (
          <Badge key={c} variant="secondary">
            {c}
          </Badge>
        ))}
      </span>
      <span className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{manufacturer.productCount} products</span>
        <RatingStars rating={manufacturer.rating} count={manufacturer.reviewCount} />
      </span>
    </Link>
  );
}

export function FilterLinks({
  items,
  current,
  param,
  base,
}: {
  items: { label: string; value: string }[];
  current: string | undefined;
  param: string;
  base: string;
}) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Filter">
      {items.map((item) => {
        const active = (current ?? '') === item.value;
        const href = item.value ? `${base}?${param}=${encodeURIComponent(item.value)}` : base;
        return (
          <li key={item.label}>
            <Link
              href={href}
              aria-current={active ? 'true' : undefined}
              className={`inline-block rounded-full border px-3 py-1.5 text-sm transition-colors ${active ? 'border-primary bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
