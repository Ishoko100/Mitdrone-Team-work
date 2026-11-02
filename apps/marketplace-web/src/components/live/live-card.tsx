import { Badge } from '@mitdrone/ui';
import { formatDateTime } from '@mitdrone/utils';
import { PlayCircle } from 'lucide-react';
import Link from 'next/link';

import type { LiveSession } from '@mitdrone/types';

export const LIVE_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All sessions' },
  { value: 'product_demo', label: 'Live Product Demonstrations' },
  { value: 'flight_demo', label: 'Drone Flight Demonstrations' },
  { value: 'product_launch', label: 'New Product Launches' },
  { value: 'manufacturer_session', label: 'Manufacturer Sessions' },
  { value: 'training', label: 'Drone Training' },
  { value: 'expert_talk', label: 'Expert Talks' },
  { value: 'live_deal', label: 'Live Deals' },
];

export function StatusPill({ session }: { session: LiveSession }) {
  if (session.status === 'live')
    return (
      <Badge variant="destructive" className="bg-destructive text-destructive-foreground gap-1">
        <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" /> Live
      </Badge>
    );
  return <Badge variant="secondary">{session.status === 'ended' ? 'Replay' : 'Upcoming'}</Badge>;
}

export function LiveCard({ session }: { session: LiveSession }) {
  return (
    <Link
      href={`/live/${session.id}`}
      className="bg-card shadow-soft hover:shadow-card flex h-full flex-col gap-2 rounded-xl border p-4 transition-shadow"
    >
      <span className="flex items-center gap-2">
        <StatusPill session={session} />
        {session.status === 'live' ? (
          <span className="text-muted-foreground text-xs">{session.viewerCount} watching</span>
        ) : null}
      </span>
      <span className="flex items-start gap-2 font-medium leading-snug">
        <PlayCircle className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {session.title}
      </span>
      <span className="text-muted-foreground line-clamp-2 text-sm">{session.description}</span>
      <span className="text-muted-foreground mt-auto text-xs">
        {session.hostName} · {formatDateTime(session.startsAt)}
      </span>
    </Link>
  );
}
