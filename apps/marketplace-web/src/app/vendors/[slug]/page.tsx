import { Badge } from '@mitdrone/ui';
import { BadgeCheck, Clock, MapPin, RotateCcw } from 'lucide-react';
import { Suspense } from 'react';

import { VENDOR_TYPE_LABELS } from '@/components/directory/cards';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ListingSkeleton } from '@/components/listing/listing-skeleton';
import { ProductListing } from '@/components/listing/product-listing';
import { RatingStars } from '@/components/product/rating-stars';
import { getVendor } from '@/lib/data';
import { jsonLdString, vendorJsonLd } from '@/lib/seo';

import type { SearchParams } from '@/lib/query';
import type { Metadata } from 'next';

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vendor = await getVendor((await params).slug);
  return {
    title: vendor.name,
    description: vendor.description,
    alternates: { canonical: `/vendors/${vendor.slug}` },
  };
}

export default async function VendorPage({ params, searchParams }: Props) {
  const vendor = await getVendor((await params).slug);
  const header = (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(vendorJsonLd(vendor)) }}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Sellers', href: '/vendors' },
          { label: vendor.name },
        ]}
      />
      <div className="from-accent/60 to-card mb-8 grid gap-6 rounded-2xl border bg-gradient-to-br p-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{vendor.name}</h2>
            {vendor.verified ? (
              <Badge variant="success" className="gap-1">
                <BadgeCheck className="size-3" aria-hidden="true" /> Verified seller
              </Badge>
            ) : null}
            <Badge variant="secondary">{VENDOR_TYPE_LABELS[vendor.type] ?? vendor.type}</Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl">{vendor.description}</p>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="size-4" aria-hidden="true" />
              {vendor.city}, {vendor.state}
            </span>
            <RatingStars rating={vendor.rating} count={vendor.reviewCount} />
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Clock className="text-primary size-4" aria-hidden="true" />
            Ships within {vendor.shipping.handlingDays} business days
          </li>
          <li className="flex items-start gap-2">
            <RotateCcw className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="max-w-xs">{vendor.returnPolicy}</span>
          </li>
        </ul>
      </div>
    </>
  );
  return (
    <Suspense fallback={<ListingSkeleton />}>
      <ProductListing
        searchParams={await searchParams}
        title={`Products from ${vendor.name}`}
        fixed={{ vendor: vendor.slug }}
        breadcrumb={header}
      />
    </Suspense>
  );
}
