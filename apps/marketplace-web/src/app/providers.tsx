'use client';

import '@/mocks/init';

import { AuthProvider } from '@mitdrone/auth';
import { getQueryClient } from '@mitdrone/sdk';
import { ThemeProvider, Toaster, TooltipProvider } from '@mitdrone/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { useCartStore } from '@/stores/cart';

function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider storageKey="mitdrone.marketplace" allowedRoles={['customer']}>
          <TooltipProvider delayDuration={200}>
            <CartHydrator />
            {children}
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
