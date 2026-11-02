'use client';

import {
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@mitdrone/ui';
import { PRICE_RANGES } from '@mitdrone/utils';
import { SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useState, type ReactNode } from 'react';

import { withParams } from '@/lib/query';

export interface Facets {
  categories: { slug: string; name: string; group: string }[];
  vendors: { slug: string; name: string }[];
  brands: string[];
}

const ANY = '__any__';
const KIND_LABELS: Record<string, string> = {
  drone: 'Drones',
  accessory: 'Accessories',
  spare_part: 'Spare parts',
  payload: 'Payloads',
  equipment: 'Equipment',
};
const GROUP_LABELS: Record<string, string> = {
  drones: 'Drone types',
  industry: 'Industries',
  accessories: 'Accessories',
  equipment: 'Equipment',
};
const FILTER_KEYS = [
  'category',
  'brand',
  'vendor',
  'kind',
  'condition',
  'minPrice',
  'maxPrice',
  'minRating',
  'onSale',
  'listingType',
  'featured',
  'deal',
];

function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return {
    params,
    set: (updates: Record<string, string | number | null | undefined>) =>
      router.push(`${pathname}${withParams(params, updates)}`, { scroll: false }),
    clear: () =>
      router.push(
        `${pathname}${withParams(new URLSearchParams(params.get('q') ? { q: params.get('q') ?? '' } : {}), {})}`,
        { scroll: false },
      ),
  };
}

export const countActiveFilters = (params: URLSearchParams, hidden: string[] = []): number =>
  FILTER_KEYS.filter((k) => params.has(k) && !hidden.includes(k)).length -
  (params.has('minPrice') && params.has('maxPrice') ? 1 : 0);

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2 border-b pb-5">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | null) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <Group title={label}>
      <Select value={value ?? ANY} onValueChange={(v) => onChange(v === ANY ? null : v)}>
        <SelectTrigger aria-label={label} id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {children}
        </SelectContent>
      </Select>
    </Group>
  );
}

function Radios({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <RadioGroup value={value} onValueChange={onChange} aria-label={name}>
      {options.map((o) => (
        <div key={o.value} className="flex items-center gap-2">
          <RadioGroupItem value={o.value} id={`${id}-${o.value}`} />
          <Label htmlFor={`${id}-${o.value}`} className="cursor-pointer font-normal">
            {o.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export function FiltersPanel({ facets, hide = [] }: { facets: Facets; hide?: string[] }) {
  const { params, set, clear } = useFilterNav();
  const min = params.get('minPrice');
  const max = params.get('maxPrice');
  const priceId =
    PRICE_RANGES.find((r) => String(r.min) === min && (r.max ? String(r.max) === max : !max))?.id ??
    ANY;
  const grouped = Object.entries(GROUP_LABELS).map(([group, label]) => ({
    group,
    label,
    items: facets.categories.filter((c) => c.group === group),
  }));
  const shown = (key: string) => !hide.includes(key);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear all
        </Button>
      </div>
      {shown('kind') ? (
        <Group title="Type">
          <Radios
            name="Type"
            value={params.get('kind') ?? ANY}
            onChange={(v) => set({ kind: v === ANY ? null : v })}
            options={[
              { value: ANY, label: 'All' },
              ...Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label })),
            ]}
          />
        </Group>
      ) : null}
      {shown('category') ? (
        <SelectFilter
          label="Category"
          value={params.get('category') ?? undefined}
          onChange={(v) => set({ category: v })}
        >
          {grouped.map(({ group, label, items }) => (
            <div key={group}>
              <p className="text-muted-foreground px-2 pt-2 text-xs font-medium">{label}</p>
              {items.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectFilter>
      ) : null}
      {shown('condition') ? (
        <Group title="Condition">
          <Radios
            name="Condition"
            value={params.get('condition') ?? ANY}
            onChange={(v) => set({ condition: v === ANY ? null : v })}
            options={[
              { value: ANY, label: 'Any' },
              { value: 'new', label: 'New' },
              { value: 'used', label: 'Used' },
              { value: 'refurbished', label: 'Refurbished' },
            ]}
          />
        </Group>
      ) : null}
      <Group title="Price">
        <Radios
          name="Price"
          value={priceId}
          onChange={(id) => {
            const range = PRICE_RANGES.find((r) => r.id === id);
            set({
              minPrice: range && range.min > 0 ? range.min : null,
              maxPrice: range?.max ?? null,
            });
          }}
          options={[
            { value: ANY, label: 'Any price' },
            ...PRICE_RANGES.map((r) => ({ value: r.id, label: r.label })),
          ]}
        />
      </Group>
      <Group title="Rating">
        <Radios
          name="Rating"
          value={params.get('minRating') ?? ANY}
          onChange={(v) => set({ minRating: v === ANY ? null : v })}
          options={[
            { value: ANY, label: 'Any rating' },
            { value: '4', label: '4 stars & up' },
            { value: '3', label: '3 stars & up' },
          ]}
        />
      </Group>
      {shown('brand') ? (
        <SelectFilter
          label="Brand"
          value={params.get('brand') ?? undefined}
          onChange={(v) => set({ brand: v })}
        >
          {facets.brands.map((b) => (
            <SelectItem key={b} value={b}>
              {b}
            </SelectItem>
          ))}
        </SelectFilter>
      ) : null}
      {shown('vendor') ? (
        <SelectFilter
          label="Seller"
          value={params.get('vendor') ?? undefined}
          onChange={(v) => set({ vendor: v })}
        >
          {facets.vendors.map((v) => (
            <SelectItem key={v.slug} value={v.slug}>
              {v.name}
            </SelectItem>
          ))}
        </SelectFilter>
      ) : null}
    </div>
  );
}

export function FiltersSheet({ facets, hide }: { facets: Facets; hide?: string[] }) {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const count = countActiveFilters(params, hide);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal aria-hidden="true" /> Filters{count > 0 ? ` (${count})` : ''}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter products</SheetTitle>
        </SheetHeader>
        <FiltersPanel facets={facets} {...(hide ? { hide } : {})} />
        <Button onClick={() => setOpen(false)} className="sticky bottom-0">
          Show results
        </Button>
      </SheetContent>
    </Sheet>
  );
}

const LABELS: Record<string, (v: string, f: Facets) => string> = {
  q: (v) => `“${v}”`,
  category: (v, f) => f.categories.find((c) => c.slug === v)?.name ?? v,
  vendor: (v, f) => f.vendors.find((x) => x.slug === v)?.name ?? v,
  brand: (v) => v,
  kind: (v) => KIND_LABELS[v] ?? v,
  condition: (v) => `${v[0]?.toUpperCase() ?? ''}${v.slice(1)}`,
  minRating: (v) => `${v}★ & up`,
  onSale: () => 'On sale',
  featured: () => 'Featured',
  deal: () => 'Deals',
  listingType: (v) => (v === 'rent' ? 'For rent' : 'For sale'),
};

export function ActiveFilters({ facets, hide = [] }: { facets: Facets; hide?: string[] }) {
  const { params, set } = useFilterNav();
  const chips: { key: string[]; label: string }[] = [];
  for (const [key, make] of Object.entries(LABELS)) {
    const value = params.get(key);
    if (value && !hide.includes(key)) chips.push({ key: [key], label: make(value, facets) });
  }
  const min = params.get('minPrice');
  const max = params.get('maxPrice');
  if (min || max) {
    const range = PRICE_RANGES.find(
      (r) => String(r.min) === (min ?? '0') && (r.max ? String(r.max) === max : !max),
    );
    chips.push({ key: ['minPrice', 'maxPrice'], label: range?.label ?? 'Custom price' });
  }
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.key.join()}>
          <button
            type="button"
            onClick={() => set(Object.fromEntries(chip.key.map((k) => [k, null])))}
            className="bg-secondary hover:bg-accent inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
            aria-label={`Remove filter: ${chip.label}`}
          >
            {chip.label} <X className="size-3" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
