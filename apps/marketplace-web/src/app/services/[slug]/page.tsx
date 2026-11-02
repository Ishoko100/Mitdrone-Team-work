import { Badge, Button } from '@mitdrone/ui';
import { BadgeCheck, MapPin } from 'lucide-react';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { RatingStars } from '@/components/product/rating-stars';
import { ServicePrice } from '@/components/services/service-card';
import { getService, getServiceCategories, getServices } from '@/lib/data';

import type { Metadata } from 'next';

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getServices({ pageSize: 100 })).data.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getService((await params).slug);
  return {
    title: s.title,
    description: s.description,
    alternates: { canonical: `/services/${s.slug}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const [service, categories] = await Promise.all([
    getService((await params).slug),
    getServiceCategories(),
  ]);
  const category = categories.find((c) => c.id === service.categoryId);
  return (
    <div className="container max-w-4xl space-y-8 py-10">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            ...(category
              ? [{ label: category.name, href: `/services?category=${category.slug}` }]
              : []),
            { label: service.title },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">{service.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <RatingStars rating={service.rating} count={service.reviewCount} />
          {service.verified ? (
            <Badge variant="success" className="gap-1">
              <BadgeCheck className="size-3" aria-hidden="true" />
              Verified operator
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <p className="leading-relaxed">{service.description}</p>
          <section aria-labelledby="coverage" className="space-y-2">
            <h2 id="coverage" className="text-lg font-semibold">
              Where they work
            </h2>
            <ul className="flex flex-wrap gap-2">
              {service.coverageStates.map((s) => (
                <li key={s}>
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="size-3" aria-hidden="true" />
                    {s}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
          {service.vendor ? (
            <Link
              href={`/vendors/${service.vendor.slug}`}
              className="hover:bg-muted/50 block rounded-xl border p-4 transition-colors"
            >
              <span className="font-medium">Offered by {service.vendor.name}</span>
              <span className="text-muted-foreground block text-sm">
                {service.vendor.city}, {service.vendor.state}
              </span>
            </Link>
          ) : null}
        </div>
        <aside className="bg-card shadow-soft h-fit space-y-4 rounded-xl border p-5">
          <p className="text-xl font-semibold">
            <ServicePrice service={service} />
          </p>
          <Button asChild className="w-full" size="lg">
            <Link href={`/services/post-project?service=${category?.slug ?? ''}`}>
              Request a quote
            </Link>
          </Button>
          <p className="text-muted-foreground text-xs">
            Prices are a guide. Final quotes depend on location and size.
          </p>
        </aside>
      </div>
    </div>
  );
}
