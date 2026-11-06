import { Badge, Button } from '@mitdrone/ui';
import { formatDateTime, formatMoney } from '@mitdrone/utils';
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

import { ProductGrid } from '@/components/product/product-card';
import { RatingStars } from '@/components/product/rating-stars';


import type {
  Category,
  LiveSession,
  Manufacturer,
  Product,
  ServiceListing
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
    <section className="marketplace-hero relative overflow-hidden border-b">
      <div className="container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-16">
        <div className="relative z-10 space-y-6">
          <Badge className="marketplace-hero-badge gap-1.5 rounded-full px-3 py-1">
            <ShieldCheck className="size-3.5" aria-hidden="true" /> Verified sellers · Buyer protection
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find the right drone for <span className="marketplace-hero-highlight">the work ahead.</span>
            </h1>
            <p className="text-muted-foreground max-w-xl text-base leading-relaxed sm:text-lg">
              Shop drones, equipment and services for mapping, agriculture, inspection and more.
            </p>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs font-medium sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="text-primary size-4" aria-hidden="true" /> Verified sellers
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="text-primary size-4" aria-hidden="true" /> Buyer protection
            </span>
          </div>
        </div>
        <div className="marketplace-hero-visual relative isolate min-h-[280px] overflow-hidden rounded-[2rem] border sm:min-h-[390px] lg:min-h-[460px]">
          <div className="marketplace-hero-orbit marketplace-hero-orbit-one" />
          <div className="marketplace-hero-orbit marketplace-hero-orbit-two" />
          <Image
            src="/hero-drone.jpg"
            alt="Camera drone flying over a landscape"
            fill
            priority
            sizes="(min-width:1024px) 45vw, 100vw"
            className="relative z-10 object-cover"
          />
          <div className="marketplace-hero-float marketplace-hero-float-top absolute left-4 top-4 z-20 flex items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur-md sm:left-6 sm:top-6">
            <span className="bg-emerald-400/15 text-emerald-300 flex size-9 items-center justify-center rounded-xl">
              <BadgeCheck className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-semibold sm:text-sm">Drone marketplace</span>
              <span className="block text-[10px] opacity-75 sm:text-xs">Shop with confidence</span>
            </span>
          </div>
          <div className="marketplace-hero-float marketplace-hero-float-bottom absolute bottom-4 right-4 z-20 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-md sm:bottom-6 sm:right-6">
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] opacity-70 sm:text-xs">
              One marketplace
            </span>
            <span className="mt-1 block text-sm font-semibold sm:text-base">
              Drones · Gear · Services
            </span>
          </div>
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
        title={<> Deals of the Week</>}
        description="Limited-time prices from verified sellers."
        href="/offers"
      />
      <ProductGrid products={products.slice(0, 5)} />
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
      <ProductGrid products={products.slice(0, 10)} />
    </Section>
  );
}

export function EquipmentSection({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <Section>
      <SectionHeader title="Drone Equipment" href="/products?kind=equipment" />
      <ProductGrid products={products.slice(0, 5)} />
    </Section>
  );
}

export function AccessoriesSection({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <Section>
      <SectionHeader title="Accessories" href="/products?kind=accessory" />
      <ProductGrid products={products.slice(0, 5)} />
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

const TRUSTED_BRANDS = [
  { name: 'DJI', style: 'font-extrabold italic tracking-tight' },
  { name: 'AUTEL', subname: 'ROBOTICS', style: 'font-bold tracking-wide' },
  { name: 'Parrot', style: 'font-serif text-2xl' },
  { name: 'SKYDIO', style: 'font-bold tracking-tight' },
  { name: 'YUNEEC', style: 'font-extrabold tracking-wide' },
  { name: 'HIKVISION', style: 'font-bold italic tracking-tight' },
  { name: 'Insta360', style: 'font-extrabold tracking-tight' },
];

export function TrustedBrandsStrip() {
  return (
    <Section className="py-12">
      <SectionHeader
        title="Trusted Drone Brands"
        description="The names shaping the future of flight."
      />
      <div className="relative isolate overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-muted/50 to-primary/10 px-5 py-10 shadow-sm sm:px-8">
        <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 size-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="brand-marquee">
          <div className="brand-marquee-track">
            {[false, true].map((isDuplicate) => (
              <ul
                key={isDuplicate ? 'duplicate' : 'brands'}
                aria-hidden={isDuplicate || undefined}
                className="flex shrink-0 items-center gap-4 px-2 sm:gap-5 sm:px-3 lg:gap-6"
              >
                {TRUSTED_BRANDS.map((brand) => (
                  <li
                    key={brand.name}
                    className="bg-background/85 text-foreground/85 flex min-h-20 min-w-36 items-center justify-center gap-1 rounded-2xl border border-border/70 px-5 py-4 text-center shadow-lg shadow-black/5 backdrop-blur-sm sm:min-h-24 sm:min-w-40"
                    aria-label={isDuplicate ? undefined : brand.name}
                  >
                    <span className={brand.style}>{brand.name}</span>
                    {brand.subname ? (
                      <span className="self-end pb-0.5 text-[8px] font-semibold tracking-widest">
                        {brand.subname}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
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
