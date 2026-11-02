import { Suspense } from 'react';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PostProjectForm } from '@/components/services/post-project-form';
import { getServiceCategories } from '@/lib/data';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post a project',
  description: 'Describe your drone job and receive quotes from verified operators.',
};

export default async function PostProjectPage() {
  const categories = await getServiceCategories();
  return (
    <div className="container max-w-3xl space-y-6 py-10">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: 'Post a project' },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">Post a project</h1>
        <p className="text-muted-foreground">
          Tell operators what you need. You choose the quote you like best.
        </p>
      </div>
      <Suspense fallback={null}>
        <PostProjectForm
          categories={categories
            .filter((c) => c.group !== 'professional')
            .map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}
        />
      </Suspense>
    </div>
  );
}
