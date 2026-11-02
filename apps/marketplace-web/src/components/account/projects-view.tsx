'use client';

import { getErrorMessage, useMyServiceRequests, useRequestQuotes } from '@mitdrone/sdk';
import { Button, EmptyState, ErrorState, Skeleton, StatusBadge } from '@mitdrone/ui';
import { formatDate, formatMoney } from '@mitdrone/utils';
import { Briefcase } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { ServiceRequest } from '@mitdrone/types';

function Quotes({ requestId }: { requestId: string }) {
  const quotes = useRequestQuotes(requestId);
  if (quotes.isPending) return <Skeleton className="h-16 w-full" />;
  if (quotes.isError)
    return (
      <p role="alert" className="text-destructive text-sm">
        {getErrorMessage(quotes.error)}
      </p>
    );
  if (quotes.data.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        No quotes yet. Operators usually reply within a day.
      </p>
    );
  return (
    <ul className="space-y-2">
      {quotes.data.map((q) => (
        <li key={q.id} className="bg-background rounded-lg border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{q.vendor?.name ?? 'Operator'}</span>
            <span className="font-semibold">{formatMoney(q.price)}</span>
          </div>
          <p className="text-muted-foreground">{q.message}</p>
          <p className="text-muted-foreground text-xs">About {q.estimatedDays} days</p>
        </li>
      ))}
    </ul>
  );
}

function Project({ project }: { project: ServiceRequest }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{project.title}</p>
        <StatusBadge status={project.status} />
      </div>
      <p className="text-muted-foreground text-sm">
        {project.city ? `${project.city}, ` : ''}
        {project.state} · Posted {formatDate(project.createdAt)}
        {project.areaHectares ? ` · ${project.areaHectares} ha` : ''}
        {project.budget ? ` · Budget ${formatMoney(project.budget)}` : ''}
      </p>
      <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide' : 'View'} quotes ({project.quoteCount})
      </Button>
      {open ? <Quotes requestId={project.id} /> : null}
    </li>
  );
}

export function ProjectsView() {
  const projects = useMyServiceRequests();
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">My projects</h1>
          <p className="text-muted-foreground text-sm">
            Drone jobs you have posted and the quotes you received.
          </p>
        </div>
        <Button asChild>
          <Link href="/services/post-project">Post a project</Link>
        </Button>
      </header>
      {projects.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : projects.isError ? (
        <ErrorState onRetry={() => projects.refetch()} />
      ) : projects.data.data.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects yet"
          description="Need your farm mapped or a site inspected? Post a project."
        />
      ) : (
        <ul className="space-y-4">
          {projects.data.data.map((p) => (
            <Project key={p.id} project={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
