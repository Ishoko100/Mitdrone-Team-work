'use client';

import { useServices } from '@mitdrone/sdk';
import {
  Button,
  EmptyState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  cn,
} from '@mitdrone/ui';
import { NIGERIAN_STATES } from '@mitdrone/utils';
import { ArrowLeft, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ServiceCard } from './service-card';

import type { ServiceCategory } from '@mitdrone/types';

const AREA_SERVICES = new Set([
  'mapping',
  'land-surveying',
  'photogrammetry',
  '3d-mapping',
  'agriculture-monitoring',
  'crop-spraying',
  'mining',
  'construction-monitoring',
]);
const STEPS = ['Service', 'Location & size', 'Matches'];

type Cat = Pick<ServiceCategory, 'slug' | 'name' | 'group'>;

/** Guided finder, e.g. Ibrahim in Zaria wants his farm mapped: pick Mapping, Kaduna, 40 ha, see matches. */
export function ServiceFinder({
  categories,
  initialService,
}: {
  categories: Cat[];
  initialService?: string | undefined;
}) {
  const valid = categories.some((c) => c.slug === initialService);
  const [step, setStep] = useState(valid ? 2 : 1);
  const [service, setService] = useState<string | undefined>(valid ? initialService : undefined);
  const [filter, setFilter] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const selected = categories.find((c) => c.slug === service);
  const matches = useServices({
    ...(service ? { category: service } : {}),
    ...(state ? { state } : {}),
    pageSize: 12,
  });
  const projectHref = `/services/post-project?${new URLSearchParams({ ...(service ? { service } : {}), ...(state ? { state } : {}), ...(city ? { city } : {}), ...(area ? { area } : {}) }).toString()}`;
  const list = categories.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-8">
      <ol className="flex flex-wrap gap-2 text-sm" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={step === i + 1 ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1',
              step === i + 1
                ? 'border-primary bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground',
            )}
          >
            <span className="bg-primary/10 flex size-5 items-center justify-center rounded-full text-xs">
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <section aria-labelledby="pick" className="space-y-4">
          <h2 id="pick" className="text-xl font-semibold">
            What do you need done?
          </h2>
          <div className="max-w-sm space-y-1.5">
            <Label htmlFor="svc-filter">Search services</Label>
            <Input
              id="svc-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="e.g. mapping, spraying, inspection"
            />
          </div>
          {list.length === 0 ? (
            <p className="text-muted-foreground">No service matches “{filter}”.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setService(c.slug);
                      setStep(2);
                    }}
                    className="bg-card hover:border-primary hover:bg-accent/40 w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="where" className="max-w-xl space-y-5">
          <h2 id="where" className="text-xl font-semibold">
            Where is the job{service && AREA_SERVICES.has(service) ? ' and how big is it' : ''}?
          </h2>
          <p className="text-muted-foreground text-sm">
            Service: <strong>{selected?.name}</strong>{' '}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setStep(1)}
            >
              Change
            </button>
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="svc-state">State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="svc-state">
                <SelectValue placeholder="Choose a state" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-city">Town or city (optional)</Label>
            <Input
              id="svc-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
            />
          </div>
          {service && AREA_SERVICES.has(service) ? (
            <div className="space-y-1.5">
              <Label htmlFor="svc-area">Approximate size in hectares</Label>
              <Input
                id="svc-area"
                inputMode="decimal"
                value={area}
                onChange={(e) => setArea(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="e.g. 40"
              />
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft /> Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!state}>
              Show matches
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby="matches" className="space-y-5">
          <div className="space-y-1">
            <h2 id="matches" className="text-xl font-semibold">
              Verified operators for {selected?.name} in {state}
            </h2>
            <p className="text-muted-foreground text-sm">
              {city ? `${city}. ` : ''}
              {area ? `${area} hectares. ` : ''}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setStep(2)}
              >
                Edit details
              </button>
            </p>
          </div>
          {matches.isPending ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <li key={n}>
                  <Skeleton className="h-40 w-full" />
                </li>
              ))}
            </ul>
          ) : matches.data && matches.data.data.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.data.data.map((s) => (
                <li key={s.id}>
                  <ServiceCard service={s} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No operators listed in that state yet"
              description="Post your project anyway and we will notify operators who can travel."
            />
          )}
          <div className="bg-accent/40 flex flex-wrap items-center gap-3 rounded-xl border p-4">
            <p className="flex-1 text-sm">
              Want quotes instead? Post your project once and verified operators will reply.
            </p>
            <Button asChild>
              <Link href={projectHref}>Post this project</Link>
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
