'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast } from 'sonner';

import type { ComponentProps } from 'react';

export function Toaster(props: ComponentProps<typeof Sonner>) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' || resolvedTheme === 'light' ? resolvedTheme : 'system';
  return (
    <Sonner
      theme={theme}
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast !border-border !bg-popover !text-popover-foreground !shadow-pop !rounded-lg',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground',
        },
      }}
      {...props}
    />
  );
}

export { toast };
