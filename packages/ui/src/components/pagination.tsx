import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../lib/cn';

import { Button } from './button';

export function getPageRange(
  page: number,
  totalPages: number,
  siblings = 1,
): (number | 'ellipsis')[] {
  const total = Math.max(1, totalPages);
  const range: (number | 'ellipsis')[] = [];
  const start = Math.max(2, page - siblings);
  const end = Math.min(total - 1, page + siblings);
  range.push(1);
  if (start > 2) range.push('ellipsis');
  for (let p = start; p <= end; p++) range.push(p);
  if (end < total - 1) range.push('ellipsis');
  if (total > 1) range.push(total);
  return range;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Controlled pagination. Pair it with URL search params for shareable state. */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft aria-hidden="true" />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      {getPageRange(page, totalPages).map((item, index) =>
        item === 'ellipsis' ? (
          <span key={`e${index}`} aria-hidden="true" className="text-muted-foreground px-2">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? 'default' : 'ghost'}
            size="sm"
            className="min-w-9"
            onClick={() => onPageChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
