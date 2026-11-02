import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { getContentPage, getContentPages } from '@/lib/data';

import { Alert } from './alert';
import { BusinessForm } from './business-form';

import type { ContentSection } from '@mitdrone/types';
import type { Metadata } from 'next';

export const SECTION_META: Record<ContentSection, { label: string; base: string; blurb: string }> =
  {
    learn: {
      label: 'Learn',
      base: '/learn',
      blurb: 'Guides, news and training to help you buy, fly and grow.',
    },
    company: {
      label: 'About Mitdrone',
      base: '/about',
      blurb: 'Who we are and why we are building Mitdrone.',
    },
    'trust-safety': {
      label: 'Trust & Safety',
      base: '/trust-safety',
      blurb: 'How we keep every purchase and every seller safe.',
    },
    business: {
      label: 'Business',
      base: '/business',
      blurb: 'Enterprise buying, bulk orders and fleet support.',
    },
    support: {
      label: 'Support',
      base: '/support',
      blurb: 'Help with orders, returns, warranty and repairs.',
    },
    compliance: {
      label: 'Compliance',
      base: '/compliance',
      blurb: 'Drone regulations and registration resources.',
    },
  };

const FORM_SLUGS = new Set(['contact-us', 'contact-support']);

type PageProps = { params: Promise<{ slug: string }> };

/** One factory builds the page, metadata and static params for every content section. */
export function makeContentRoute(section: ContentSection) {
  const meta = SECTION_META[section];
  async function load(slug: string) {
    const page = await getContentPage(slug);
    if (page.section !== section) notFound();
    return page;
  }
  return {
    generateStaticParams: async () =>
      (await getContentPages(section)).map((p) => ({ slug: p.slug })),
    generateMetadata: async ({ params }: PageProps): Promise<Metadata> => {
      const page = await load((await params).slug);
      return {
        title: page.title,
        description: page.summary,
        alternates: { canonical: `${meta.base}/${page.slug}` },
      };
    },
    Page: async ({ params }: PageProps) => {
      const [page, siblings] = await Promise.all([
        load((await params).slug),
        getContentPages(section),
      ]);
      const showForm = section === 'business' || FORM_SLUGS.has(page.slug);
      return (
        <div className="container py-10">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: meta.label, href: meta.base },
              { label: page.title },
            ]}
          />
          <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
            <nav aria-label={`${meta.label} pages`} className="hidden lg:block">
              <p className="mb-3 text-sm font-semibold">{meta.label}</p>
              <ul className="space-y-1">
                {siblings.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`${meta.base}/${s.slug}`}
                      aria-current={s.slug === page.slug ? 'page' : undefined}
                      className={`block rounded-md px-3 py-1.5 text-sm ${s.slug === page.slug ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <article className="max-w-3xl space-y-6">
              <header className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
                <p className="text-muted-foreground text-lg">{page.summary}</p>
              </header>
              {section === 'compliance' ? (
                <Alert>
                  Regulatory information on this page is a placeholder and must be verified by the
                  Mitdrone compliance team before launch. Always check current NCAA rules before
                  flying.
                </Alert>
              ) : null}
              <div className="space-y-4 leading-relaxed">
                {page.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {showForm ? (
                <BusinessForm
                  topic={`${section}/${page.slug}`}
                  title={page.title === 'Request a Quote' ? 'Request a quote' : 'Send us a message'}
                />
              ) : null}
            </article>
          </div>
        </div>
      );
    },
  };
}

export function makeContentIndex(section: ContentSection) {
  const meta = SECTION_META[section];
  return {
    metadata: { title: meta.label, description: meta.blurb } satisfies Metadata,
    Page: async () => {
      const pages = await getContentPages(section);
      return (
        <div className="container py-10">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: meta.label }]} />
          <header className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{meta.label}</h1>
            <p className="text-muted-foreground">{meta.blurb}</p>
          </header>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`${meta.base}/${p.slug}`}
                  className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-1 rounded-xl border p-5 transition-shadow"
                >
                  <span className="font-semibold">{p.title}</span>
                  <span className="text-muted-foreground text-sm">{p.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );
    },
  };
}
