'use client';

import { RequireAuth } from '@mitdrone/auth';
import { Skeleton } from '@mitdrone/ui';

import { CheckoutFlow } from './checkout-flow';

export function CheckoutGuard() {
  return (
    <RequireAuth roles={['customer']} fallback={<Skeleton className="h-96 w-full" />}>
      <CheckoutFlow />
    </RequireAuth>
  );
}
