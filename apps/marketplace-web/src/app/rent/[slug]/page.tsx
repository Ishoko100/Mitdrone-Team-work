import { redirect } from 'next/navigation';

/** Rentals are product pages with a booking panel. Keep /rent/[slug] as a friendly alias. */
export default async function RentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  redirect(`/products/${(await params).slug}`);
}
