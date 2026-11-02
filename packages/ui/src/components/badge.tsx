import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/cn';

import type { ComponentProps } from 'react';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-accent-foreground border-transparent',
        secondary: 'bg-secondary text-secondary-foreground border-transparent',
        outline: 'text-foreground',
        success: 'bg-success/10 text-success border-transparent',
        warning: 'bg-warning/10 text-warning border-transparent',
        destructive: 'bg-destructive/10 text-destructive border-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

type BadgeVariant = NonNullable<BadgeProps['variant']>;

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: 'success',
  approved: 'success',
  paid: 'success',
  delivered: 'success',
  completed: 'success',
  verified: 'success',
  succeeded: 'success',
  published: 'success',
  resolved_refund: 'success',
  resolved_no_refund: 'success',
  live: 'success',
  pending: 'warning',
  pending_review: 'warning',
  processing: 'warning',
  submitted: 'warning',
  under_review: 'warning',
  in_progress: 'warning',
  on_hold: 'warning',
  open: 'warning',
  scheduled: 'warning',
  shipped: 'default',
  draft: 'secondary',
  rejected: 'destructive',
  cancelled: 'destructive',
  failed: 'destructive',
  suspended: 'destructive',
  flagged: 'destructive',
  refunded: 'secondary',
  archived: 'secondary',
  closed: 'secondary',
  ended: 'secondary',
  hidden: 'secondary',
};

/** Maps any domain status string to a consistent badge. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const label = status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  return (
    <Badge variant={STATUS_VARIANTS[status] ?? 'secondary'} className={className}>
      {label}
    </Badge>
  );
}
