import { cn } from '@mitdrone/ui';
import { formatMoney } from '@mitdrone/utils';

import type { Money } from '@mitdrone/types';

export function Price({
  price,
  compareAt,
  suffix,
  className,
  large,
}: {
  price: Money;
  compareAt?: Money | undefined;
  suffix?: string;
  className?: string;
  large?: boolean;
}) {
  const discount =
    compareAt && compareAt.amount > price.amount
      ? Math.round((1 - price.amount / compareAt.amount) * 100)
      : 0;
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
      <span className={cn('font-semibold tracking-tight', large ? 'text-3xl' : 'text-base')}>
        {formatMoney(price)}
        {suffix ? (
          <span className="text-muted-foreground text-sm font-normal"> {suffix}</span>
        ) : null}
      </span>
      {discount > 0 && compareAt ? (
        <>
          <s className="text-muted-foreground text-sm">
            <span className="sr-only">Was </span>
            {formatMoney(compareAt)}
          </s>
          <span className="text-success text-xs font-semibold">Save {discount}%</span>
        </>
      ) : null}
    </div>
  );
}
