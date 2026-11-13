'use client';

import '@/mocks/init';

import { AuthProvider } from '@mitdrone/auth';
import { getQueryClient } from '@mitdrone/sdk';
import { ThemeProvider, Toaster, TooltipProvider } from '@mitdrone/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';

import { env } from '@/lib/env';
import { useCartStore } from '@/stores/cart';
import { useWishlistStore } from '@/stores/wishlist';

function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider
          storageKey="mitdrone.marketplace"
          allowedRoles={['customer']}
          mockMode={env.NEXT_PUBLIC_ENABLE_MOCKS === 'true'}
        >
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
