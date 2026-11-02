import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { LiveRoom } from '@/components/live/live-room';
import { getLiveSession, getProduct } from '@/lib/data';

import type { Metadata } from 'next';

export const revalidate = 15;
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getLiveSession((await params).id);
  return { title: s.title, description: s.description };
}

export default async function LiveSessionPage({ params }: Props) {
  const session = await getLiveSession((await params).id);
  const product = session.featuredProductId
    ? await getProduct(session.featuredProductId).catch(() => undefined)
    : undefined;
  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Live', href: '/live' },
          { label: session.title },
        ]}
      />
      <LiveRoom session={session} product={product} />
    </div>
  );
}
