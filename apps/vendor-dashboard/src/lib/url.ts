'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** Returns "?a=1&b=2" after applying updates. null/undefined/'' removes a key. Resets page unless set. */
export function withParams(
  current: URLSearchParams | string,
  updates: Record<string, string | number | null | undefined>,
): string {
  const next = new URLSearchParams(typeof current === 'string' ? current : current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') next.delete(key);
    else next.set(key, String(value));
  }
  if (!('page' in updates)) next.delete('page');
  const qs = next.toString();
  return qs ? `?${qs}` : '';
}

/** Filters, search and pagination live in the URL so views are shareable and survive reloads. */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return {
    get: (key: string) => params.get(key) ?? undefined,
    page: Math.max(1, Number(params.get('page')) || 1),
    set: (updates: Record<string, string | number | null | undefined>) =>
      router.replace(`${pathname}${withParams(params, updates)}`, { scroll: false }),
  };
}
