'use client';

import { useSearch } from '@mitdrone/sdk';
import { Input } from '@mitdrone/ui';
import { formatMoney } from '@mitdrone/utils';
import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { useDebouncedValue } from '@/lib/hooks';

interface Option {
  id: string;
  group: string;
  label: string;
  sublabel?: string;
  href: string;
  imageUrl?: string;
}

export function SearchBar({
  className,
  placeholder = 'Search drones, accessories, services, operators...',
}: {
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const root = useRef<HTMLFormElement>(null);
  const debounced = useDebouncedValue(value.trim(), 250);
  const { data, isFetching } = useSearch(debounced);

  const options = useMemo<Option[]>(() => {
    if (!data || debounced.length < 2) return [];
    return [
      ...data.products.slice(0, 5).map((p) => ({
        id: p.id,
        group: 'Products',
        label: p.title,
        sublabel: formatMoney(p.price),
        href: `/products/${p.slug}`,
        ...(p.images[0] ? { imageUrl: p.images[0].url } : {}),
      })),
      ...data.categories.slice(0, 3).map((c) => ({
        id: c.id,
        group: 'Categories',
        label: c.name,
        href: `/categories/${c.slug}`,
      })),
      ...data.services.slice(0, 3).map((s) => ({
        id: s.id,
        group: 'Services',
        label: s.title,
        ...(s.vendor ? { sublabel: s.vendor.name } : {}),
        href: `/services/${s.slug}`,
      })),
      ...data.vendors.slice(0, 2).map((v) => ({
        id: v.id,
        group: 'Sellers',
        label: v.name,
        sublabel: `${v.city}, ${v.state}`,
        href: `/vendors/${v.slug}`,
      })),
    ];
  }, [data, debounced]);

  const showPanel = open && debounced.length >= 2;
  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const target = active >= 0 ? options[active] : undefined;
    close();
    router.push(target ? target.href : `/search?q=${encodeURIComponent(value.trim())}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') return close();
    if (!options.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    }
  }

  let lastGroup = '';
  return (
    <form
      ref={root}
      role="search"
      onSubmit={submit}
      onBlur={(e) => !root.current?.contains(e.relatedTarget) && close()}
      className={`relative ${className ?? ''}`}
    >
      <Search
        className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label="Search Mitdrone"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className="h-11 rounded-full pl-10 pr-10"
      />
      {isFetching && debounced.length >= 2 ? (
        <Loader2
          className="text-muted-foreground absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin"
          aria-hidden="true"
        />
      ) : null}
      {showPanel ? (
        <div className="bg-popover shadow-pop absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border">
          <ul
            id={listId}
            role="listbox"
            aria-label="Search suggestions"
            className="max-h-[70vh] overflow-y-auto p-1"
          >
            {options.map((option, index) => {
              const header = option.group !== lastGroup;
              lastGroup = option.group;
              return (
                <li key={`${option.group}-${option.id}`} role="presentation">
                  {header ? (
                    <p className="text-muted-foreground px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide">
                      {option.group}
                    </p>
                  ) : null}
                  <Link
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === active}
                    href={option.href}
                    onClick={close}
                    onMouseEnter={() => setActive(index)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${index === active ? 'bg-accent text-accent-foreground' : ''}`}
                  >
                    {option.imageUrl ? (
                      <Image
                        src={option.imageUrl}
                        alt=""
                        width={40}
                        height={30}
                        className="bg-muted rounded object-cover"
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.sublabel ? (
                        <span className="text-muted-foreground block truncate text-xs">
                          {option.sublabel}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
            {options.length === 0 && !isFetching ? (
              <li
                role="presentation"
                className="text-muted-foreground px-3 py-6 text-center text-sm"
              >
                No quick matches. Press Enter to search everything.
              </li>
            ) : null}
            {value.trim() ? (
              <li role="presentation" className="border-t">
                <Link
                  href={`/search?q=${encodeURIComponent(value.trim())}`}
                  onClick={close}
                  className="text-primary hover:bg-accent block rounded-md px-3 py-2.5 text-sm font-medium"
                >
                  See all results for “{value.trim()}”
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </form>
  );
}
