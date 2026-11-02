'use client';

import { GuestOnly } from '@mitdrone/auth';
import { Skeleton } from '@mitdrone/ui';

import { Brand } from '@/components/layout/brand';

import type { ReactNode } from 'react';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="from-accent/60 to-background flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b px-4 py-10"
    >
      <Brand />
      <div className="bg-card shadow-card w-full max-w-md space-y-6 rounded-2xl border p-6 sm:p-8">
        <GuestOnly redirectTo="/dashboard" fallback={<Skeleton className="h-64 w-full" />}>
          {children}
        </GuestOnly>
      </div>
    </main>
  );
}
