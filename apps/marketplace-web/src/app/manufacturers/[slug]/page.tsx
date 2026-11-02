import { Badge, Button } from '@mitdrone/ui';
import { BadgeCheck, Globe, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ProductGrid } from '@/components/product/product-card';
import { RatingStars } from '@/components/product/rating-stars';
import { getManufacturer, getManufacturers, getProducts } from '@/lib/data';

import type { Metadata } from 'next';

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getManufacturers({ pageSize: 50 })).data.map((m) => ({ slug: m.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await getManufacturer((await params).slug);
  return {
    title: `${m.name} | Manufacturer profile`,
    description: m.description,
    alternates: { canonical: `/manufacturers/${m.slug}` },
  };
}

export default async function ManufacturerPage({ params }: Props) {
  const m = await getManufacturer((await params).slug);
  const products = await getProducts({ brand: m.name, listingType: 'sale', pageSize: 8 });
  const facts: [string, string][] = [
    ['Country', m.country],
    ['Products on Mitdrone', String(m.productCount)],
  ];
  return (
    <div className="container space-y-10 py-10">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Manufacturers', href: '/manufacturers' },
            { label: m.name },
          ]}
        />
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{m.name}</h1>
            <Badge variant={m.verified ? 'success' : 'warning'} className="gap-1">
              <BadgeCheck className="size-3" aria-hidden="true" />
              {m.verified ? 'Verified manufacturer' : 'Verification pending'}
            </Badge>
            {m.isNigerian ? <Badge>Nigerian</Badge> : null}
          </div>
          <p className="text-muted-foreground max-w-3xl">{m.description}</p>
          <RatingStars rating={m.rating} count={m.reviewCount} />
        </header>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section aria-labelledby="company" className="space-y-3">
          <h2 id="company" className="text-lg font-semibold">
            Company information
          </h2>
          <dl className="divide-y rounded-xl border text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section aria-labelledby="capabilities" className="space-y-3">
          <h2 id="capabilities" className="text-lg font-semibold">
            Capabilities
          </h2>
          <ul className="flex flex-wrap gap-2">
            {m.capabilities.map((c) => (
              <li key={c}>
                <Badge variant="secondary">{c}</Badge>
              </li>
            ))}
          </ul>
          <h2 className="pt-3 text-lg font-semibold">Industries served</h2>
          <ul className="flex flex-wrap gap-2">
            {m.industriesServed.map((c) => (
              <li key={c}>
                <Badge variant="outline">{c}</Badge>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="contact" className="space-y-3">
          <h2 id="contact" className="text-lg font-semibold">
            Contact
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="text-primary size-4" aria-hidden="true" />
              <a className="hover:underline" href={`mailto:${m.email}`}>
                {m.email}
              </a>
            </li>
            {m.phone ? (
              <li className="flex items-center gap-2">
                <Phone className="text-primary size-4" aria-hidden="true" />
                {m.phone}
              </li>
            ) : null}
            {m.website ? (
              <li className="flex items-center gap-2">
                <Globe className="text-primary size-4" aria-hidden="true" />
                <a
                  className="hover:underline"
                  href={m.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {m.website.replace(/^https?:\/\//, '')}
                </a>
              </li>
            ) : (
              <li className="text-muted-foreground">Website not listed yet</li>
            )}
          </ul>
        </section>
      </div>

      <section aria-labelledby="mprods" className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 id="mprods" className="text-2xl font-semibold tracking-tight">
            Products
          </h2>
          <Button asChild variant="link">
            <Link href={`/brands/${m.slug}`}>Shop all {m.name}</Link>
          </Button>
        </div>
        {products.data.length ? (
          <ProductGrid products={products.data.slice(0, 4)} />
        ) : (
          <p className="text-muted-foreground">No products listed yet.</p>
        )}
      </section>
    </div>
  );
}
