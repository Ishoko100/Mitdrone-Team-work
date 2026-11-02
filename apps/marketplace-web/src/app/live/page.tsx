import { FilterLinks } from '@/components/directory/cards';
import { LIVE_TYPES, LiveCard } from '@/components/live/live-card';
import { getLiveSessionsBy } from '@/lib/data';

import type { LiveSessionType } from '@mitdrone/types';
import type { Metadata } from 'next';

export const revalidate = 15;
export const metadata: Metadata = {
  title: 'Mitdrone Live',
  description: 'Watch live demos, launches, training and expert talks. Ask questions, then buy.',
};

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const valid = LIVE_TYPES.some((t) => t.value && t.value === type);
  const { data } = await getLiveSessionsBy({
    pageSize: 50,
    ...(valid ? { type: type as LiveSessionType } : {}),
  });
  const groups = [
    ['Live now', data.filter((s) => s.status === 'live')],
    ['Upcoming', data.filter((s) => s.status === 'scheduled')],
    ['Replays', data.filter((s) => s.status === 'ended')],
  ] as const;
  return (
    <div className="container space-y-8 py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Mitdrone Live</h1>
        <p className="text-muted-foreground">
          Watch a drone demonstrated live, ask the seller questions, then Buy Now.
        </p>
      </header>
      <FilterLinks
        param="type"
        base="/live"
        current={valid ? type : undefined}
        items={LIVE_TYPES}
      />
      {data.length === 0 ? (
        <p className="text-muted-foreground">No sessions in this category yet.</p>
      ) : (
        groups.map(([label, items]) =>
          items.length ? (
            <section key={label} aria-label={label} className="space-y-3">
              <h2 className="text-xl font-semibold">{label}</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <li key={s.id}>
                    <LiveCard session={s} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )
      )}
    </div>
  );
}
