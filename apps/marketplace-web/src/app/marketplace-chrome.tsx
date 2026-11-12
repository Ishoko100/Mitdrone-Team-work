'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export function MarketplaceChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(pathname);

  return (
    <>
      {isAuthPage ? null : <SiteHeader />}
      {children}
      {isAuthPage ? null : <SiteFooter />}
    </>
  );
}
