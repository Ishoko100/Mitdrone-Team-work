import { Badge, Button } from '@mitdrone/ui';
import { formatDateTime, formatMoney, SELLING_STEPS } from '@mitdrone/utils';
import {
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  CreditCard,
  MapPin,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { SearchBar } from '@/components/layout/search-bar';
import { ProductGrid } from '@/components/product/product-card';
import { RatingStars } from '@/components/product/rating-stars';
import { env } from '@/lib/env';

import type {
  Category,
  LiveSession,
  Manufacturer,
  Product,
  ServiceListing,
  Vendor,
} from '@mitdrone/types';
import type { ReactNode } from 'react';

export function SectionHeader({
  title,
  description,
  href,
  linkLabel = 'View all',
}: {
  title: ReactNode;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="text-primary shrink-0 text-sm font-medium hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export const Section = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={`container py-10 ${className ?? ''}`}>{children}</section>
);

export function Hero() {
  return (
    <section className="from-accent/70 to-background relative overflow-hidden border-b bg-gradient-to-b">
      <div className="container grid items-center gap-10 py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20">
        <div className="space-y-6">
          <Badge className="gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Verified drones, sellers and
            operators
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Secure Drone Marketplace
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Buy, sell, rent and discover verified drones
          </p>
          <SearchBar className="max-w-xl" />
          <ul className="flex flex-wrap gap-2 text-sm" aria-label="Popular searches">
            {[
              'DJI Mavic 3',
              'Agras sprayer',
              'Thermal inspection',
              'Farm mapping',
              'Used drones',
            ].map((term) => (
              <li key={term}>
                <Link
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="bg-background text-muted-foreground hover:text-foreground rounded-full border px-3 py-1 transition-colors"
                >
                  {term}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card shadow-card relative hidden aspect-[4/3] overflow-hidden rounded-3xl border lg:block">
          <Image
            src="/placeholders/drone-1.svg"
            alt=""
            fill
            priority
            sizes="40vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

const ENTRIES = [
  {
    title: 'Buy drones',
    text: 'New, used and refurbished drones from verified sellers.',
    href: '/products?kind=drone',
    icon: ShoppingBag,
    cta: 'Shop drones',
  },
  {
    title: 'Sell drones',
    text: 'List your drone or equipment and reach verified buyers.',
    href: '/sell',
    icon: Store,
    cta: 'Start selling',
  },
  {
    title: 'Access drone services',
    text: 'Mapping, spraying, inspection and more from vetted operators.',
    href: '/services',
    icon: Wrench,
    cta: 'Find a service',
  },
  {
    title: 'Rent a drone',
    text: 'Daily, weekly or monthly rentals, with or without a pilot.',
    href: '/rent',
    icon: CalendarClock,
    cta: 'Rent now',
  },
];

export function EntryCards() {
  return (
    <Section className="-mt-2 pb-2">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ENTRIES.map(({ title, text, href, icon: Icon, cta }) => (
          <li key={title}>
            <Link
              href={href}
              className="bg-card shadow-soft hover:shadow-card group flex h-full flex-col gap-3 rounded-xl border p-5 transition-shadow"
            >
              <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold">{title}</span>
              <span className="text-muted-foreground text-sm">{text}</span>
              <span className="text-primary mt-auto text-sm font-medium group-hover:underline">
                {cta} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function DealsSection({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <Section>
      <SectionHeader
        title={<>🔥 Deals of the Week</>}
        description="Limited-time prices from verified sellers."
        href="/offers"
      />
      <ProductGrid products={products.slice(0, 4)} />
    </Section>
  );
}

export function CategoryTiles({ categories }: { categories: Category[] }) {
  return (
    <Section>
      <SectionHeader title="Shop by category" href="/products" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/categories/${c.slug}`}
              className="bg-card hover:border-primary/50 hover:bg-accent/40 flex h-full flex-col justify-between gap-1 rounded-xl border p-4 transition-colors"
            >
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-muted-foreground text-xs">
                {c.productCount} {c.productCount === 1 ? 'item' : 'items'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function FeaturedSection({ products }: { products: Product[] }) {
  return (
    <Section>
      <SectionHeader title="Featured drones" href="/products?featured=true" />
      <ProductGrid products={products.slice(0, 8)} />
    </Section>
  );
}

export function ServicesSpotlight({ services }: { services: ServiceListing[] }) {
  const steps = [
    { icon: ClipboardList, label: 'Choose a service' },
    { icon: MapPin, label: 'Add location and size' },
    { icon: BadgeCheck, label: 'Compare verified quotes' },
  ];
  return (
    <section className="bg-muted/40 border-y py-12">
      <div className="container grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <Badge variant="secondary">Drone services</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">
            Need your farm mapped? Your site surveyed?
          </h2>
          <p className="text-muted-foreground">
            Tell us what you need done. Verified operators near you send quotes, and you pick the
            best one.
          </p>
          <ol className="space-y-3">
            {steps.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium">
                <span
                  className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full"
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="sr-only">Step {i + 1}: </span>
                  {label}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/services/find">Find a service</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/services/post-project">Post a project</Link>
            </Button>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {services.slice(0, 4).map((s) => (
            <li key={s.id}>
              <Link
                href={`/services/${s.slug}`}
                className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-2 rounded-xl border p-4 transition-shadow"
              >
                <span className="font-medium leading-snug">{s.title}</span>
                {s.vendor ? (
                  <span className="text-muted-foreground text-xs">
                    {s.vendor.name} · {s.vendor.city}
                  </span>
                ) : null}
                <RatingStars rating={s.rating} count={s.reviewCount} />
                <span className="mt-auto text-sm font-semibold">
                  {s.startingPrice ? `From ${formatMoney(s.startingPrice)}` : 'Request a quote'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function LiveStrip({ sessions }: { sessions: LiveSession[] }) {
  if (!sessions.length) return null;
  return (
    <Section>
      <SectionHeader
        title="Mitdrone Live"
        description="Watch demos, ask questions, then buy."
        href="/live"
      />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              href={`/live/${s.id}`}
              className="bg-card shadow-soft hover:shadow-card group flex h-full flex-col gap-2 rounded-xl border p-4 transition-shadow"
            >
              <span className="flex items-center gap-2">
                {s.status === 'live' ? (
                  <Badge
                    variant="destructive"
                    className="bg-destructive text-destructive-foreground gap-1"
                  >
                    <span
                      className="size-1.5 animate-pulse rounded-full bg-current"
                      aria-hidden="true"
                    />{' '}
                    Live
                  </Badge>
                ) : (
                  <Badge variant="secondary">{s.status === 'ended' ? 'Replay' : 'Upcoming'}</Badge>
                )}
                {s.status === 'live' ? (
                  <span className="text-muted-foreground text-xs">{s.viewerCount} watching</span>
                ) : null}
              </span>
              <span className="flex items-start gap-2 font-medium leading-snug">
                <PlayCircle className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {s.title}
              </span>
              <span className="text-muted-foreground mt-auto text-xs">
                {s.hostName} · {formatDateTime(s.startsAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ManufacturerStrip({ manufacturers }: { manufacturers: Manufacturer[] }) {
  if (!manufacturers.length) return null;
  return (
    <Section>
      <SectionHeader
        title="Made in Nigeria"
        description="Nigerian drone manufacturers, verified and visible."
        href="/manufacturers?nigerian=true"
        linkLabel="Explore manufacturers"
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {manufacturers.slice(0, 3).map((m) => (
          <li key={m.id}>
            <Link
              href={`/manufacturers/${m.slug}`}
              className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-3 rounded-xl border p-5 transition-shadow"
            >
              <span className="flex items-center gap-2 text-lg font-semibold">
                {m.name}
                {m.verified ? (
                  <BadgeCheck className="text-primary size-4" aria-label="Verified" />
                ) : null}
              </span>
              <span className="text-muted-foreground line-clamp-2 text-sm">{m.description}</span>
              <span className="mt-auto flex flex-wrap gap-1">
                {m.capabilities.slice(0, 3).map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function VendorStrip({ vendors }: { vendors: Vendor[] }) {
  return (
    <Section>
      <SectionHeader title="Featured sellers" href="/vendors" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vendors.slice(0, 4).map((v) => (
          <li key={v.id}>
            <Link
              href={`/vendors/${v.slug}`}
              className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-2 rounded-xl border p-4 transition-shadow"
            >
              <span className="flex items-center gap-1 font-semibold">
                {v.name}
                {v.verified ? (
                  <BadgeCheck className="text-primary size-4" aria-label="Verified seller" />
                ) : null}
              </span>
              <span className="text-muted-foreground text-xs">
                {v.city}, {v.state}
              </span>
              <RatingStars rating={v.rating} count={v.reviewCount} />
              <span className="text-muted-foreground text-xs">{v.productCount} products</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function SellingSteps() {
  return (
    <section className="bg-muted/40 border-t py-14">
      <div className="container space-y-8">
        <SectionHeader
          title="How selling works"
          description="From sign-up to payout in six steps."
          href="/sell/how-it-works"
          linkLabel="Learn more"
        />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {SELLING_STEPS.map((step, i) => (
            <li key={step.title} className="bg-card space-y-2 rounded-xl border p-4">
              <span
                className="bg-accent text-accent-foreground flex size-7 items-center justify-center rounded-full text-sm font-semibold"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <p className="font-medium">{step.title}</p>
              <p className="text-muted-foreground text-xs">{step.description}</p>
            </li>
          ))}
        </ol>
        <Button asChild size="lg">
          <a href={`${env.NEXT_PUBLIC_VENDOR_URL}/register`}>List Your Drone</a>
        </Button>
      </div>
    </section>
  );
}

export function TrustBar() {
  const items = [
    { icon: BadgeCheck, title: 'Verified sellers', text: 'KYC-checked businesses and individuals' },
    {
      icon: ShieldCheck,
      title: 'Buyer Protection',
      text: 'Get your money back if it is not as described',
    },
    { icon: CreditCard, title: 'Secure payments', text: 'Paid out only after delivery' },
    {
      icon: Truck,
      title: 'Nationwide delivery',
      text: 'Tracked shipping to all 36 states and FCT',
    },
  ];
  return (
    <Section>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <Icon className="text-primary mt-0.5 size-6 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
