'use client';

import {
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mitdrone/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { withParams } from '@/lib/query';

const SORT_LABELS: Record<string, string> = {
  newest: 'Newest',
  popular: 'Most popular',
  rating: 'Top rated',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
};

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <Select
      value={params.get('sort') ?? 'newest'}
      onValueChange={(v) =>
        router.push(`${pathname}${withParams(params, { sort: v === 'newest' ? null : v })}`, {
          scroll: false,
        })
      }
    >
      <SelectTrigger aria-label="Sort products" className="w-[190px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {Object.entries(SORT_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ListingPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      className="mt-10"
      onPageChange={(next) => {
        router.push(`${pathname}${withParams(params, { page: next === 1 ? null : next })}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    />
  );
}
