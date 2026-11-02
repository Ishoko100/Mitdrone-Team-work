'use client';

import { GuestOnly } from '@mitdrone/auth';
import { Skeleton } from '@mitdrone/ui';

import type { ReactNode } from 'react';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="bg-card shadow-card w-full max-w-md space-y-6 rounded-2xl border p-6 sm:p-8">
        <GuestOnly redirectTo="/account" fallback={<Skeleton className="h-64 w-full" />}>
          {children}
        </GuestOnly>
      </div>
    </div>
  );
}
