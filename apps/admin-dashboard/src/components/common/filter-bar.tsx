'use client';

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mitdrone/ui';
import { Search } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { useDebouncedValue } from '@/lib/hooks';
import { useUrlState } from '@/lib/url';

export interface FilterDef {
  param: string;
  label: string;
  allLabel?: string;
  options: readonly (readonly [string, string])[];
  width?: string;
}

/** Search and filters bound to the URL, so every admin view is shareable and survives reload. */
export function FilterBar({
  searchPlaceholder,
  filters = [],
  children,
}: {
  searchPlaceholder?: string;
  filters?: FilterDef[];
  children?: ReactNode;
}) {
  const url = useUrlState();
  const [search, setSearch] = useState(url.get('q') ?? '');
  const debounced = useDebouncedValue(search, 350);
  useEffect(() => {
    if ((url.get('q') ?? '') !== debounced) url.set({ q: debounced || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debounced]);

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      {searchPlaceholder ? (
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
      ) : null}
      {filters.map((f) => (
        <Select
          key={f.param}
          value={url.get(f.param) ?? 'all'}
          onValueChange={(v) => url.set({ [f.param]: v === 'all' ? null : v })}
        >
          <SelectTrigger aria-label={f.label} className={f.width ?? 'w-[170px]'}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{f.allLabel ?? `All ${f.label.toLowerCase()}`}</SelectItem>
            {f.options.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {children}
    </div>
  );
}
