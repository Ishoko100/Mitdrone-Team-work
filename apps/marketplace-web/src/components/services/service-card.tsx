import { Badge } from '@mitdrone/ui';
import { formatMoney } from '@mitdrone/utils';
import { BadgeCheck, MapPin } from 'lucide-react';
import Link from 'next/link';

import { RatingStars } from '@/components/product/rating-stars';

import type { ServiceListing } from '@mitdrone/types';

const MODEL: Record<ServiceListing['pricingModel'], string> = {
  per_hectare: '/ hectare',
  per_hour: '/ hour',
  per_project: '/ project',
  quote: '',
};

export function ServicePrice({ service }: { service: ServiceListing }) {
  return service.startingPrice ? (
    <>
      From {formatMoney(service.startingPrice)}{' '}
      <span className="text-muted-foreground text-xs font-normal">
        {MODEL[service.pricingModel]}
      </span>
    </>
  ) : (
    <>Request a quote</>
  );
}

export function ServiceCard({ service }: { service: ServiceListing }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-3 rounded-xl border p-5 transition-shadow"
    >
      <span className="font-semibold leading-snug">{service.title}</span>
      {service.vendor ? (
        <span className="text-muted-foreground flex items-center gap-1 text-sm">
          {service.vendor.name}
          {service.verified ? (
            <BadgeCheck className="text-primary size-3.5" aria-label="Verified" />
          ) : null}
        </span>
      ) : null}
      <RatingStars rating={service.rating} count={service.reviewCount} />
      <span className="flex flex-wrap gap-1">
        {service.coverageStates.slice(0, 3).map((s) => (
          <Badge key={s} variant="secondary" className="gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {s}
          </Badge>
        ))}
        {service.coverageStates.length > 3 ? (
          <Badge variant="outline">+{service.coverageStates.length - 3}</Badge>
        ) : null}
      </span>
      <span className="mt-auto text-sm font-semibold">
        <ServicePrice service={service} />
      </span>
    </Link>
  );
}
