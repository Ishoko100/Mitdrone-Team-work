import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';

import { cn } from '../../lib/cn';
import { Card } from '../card';
import { Skeleton } from '../skeleton';

export interface KpiCardProps {
  label: string;
  value: string;
  /** Percent change vs previous period. */
  delta?: number;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  loading,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        {Icon ? <Icon className="text-muted-foreground size-4" aria-hidden="true" /> : null}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      )}
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta !== undefined && !loading ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              delta >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden="true" />
            )}
            {Math.abs(delta).toFixed(1)}%
            <span className="sr-only">{delta >= 0 ? 'increase' : 'decrease'}</span>
          </span>
        ) : null}
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </div>
    </Card>
  );
}
