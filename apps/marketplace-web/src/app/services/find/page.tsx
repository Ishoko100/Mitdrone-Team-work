import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ServiceFinder } from '@/components/services/service-finder';
import { getServiceCategories } from '@/lib/data';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find a drone service',
  description: 'Pick a service, add your location and size, and see verified operators.',
};

export default async function FindServicePage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const [{ service }, categories] = await Promise.all([searchParams, getServiceCategories()]);
  return (
    <div className="container max-w-5xl space-y-8 py-10">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: 'Find a service' },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">Find the right drone service</h1>
        <p className="text-muted-foreground">Three quick steps. No account needed to browse.</p>
      </div>
      <ServiceFinder
        categories={categories
          .filter((c) => c.group !== 'professional')
          .map((c) => ({ slug: c.slug, name: c.name, group: c.group }))}
        initialService={service}
      />
    </div>
  );
}
