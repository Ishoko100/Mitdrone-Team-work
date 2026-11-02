'use client';

import '@/mocks/init';

import { AuthProvider } from '@mitdrone/auth';
import { getQueryClient } from '@mitdrone/sdk';
import { ThemeProvider, Toaster, TooltipProvider } from '@mitdrone/ui';
import { QueryClientProvider } from '@tanstack/react-query';

import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={getQueryClient()}>
        <AuthProvider
          storageKey="mitdrone.admin"
          allowedRoles={['admin', 'super_admin', 'support']}
        >
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
