'use client';

import { MegaMenu, MobileNav, ThemeToggle } from '@mitdrone/ui';

import { NAV_ITEMS } from '@/lib/nav-config';

import { AccountMenu } from './account-menu';
import { CartSheet } from './cart-sheet';
import { Logo } from './logo';
import { NavLink } from './nav-link';
import { SearchBar } from './search-bar';

export function SiteHeader() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="bg-primary text-primary-foreground px-4 py-1.5 text-center text-xs font-medium">
        Buyer Protection on every order · Verified sellers across Nigeria
      </div>
      <div className="container flex h-16 items-center gap-3">
        <MobileNav items={NAV_ITEMS} linkAs={NavLink} />
        <Logo />
        <SearchBar className="mx-4 hidden max-w-xl flex-1 md:block" />
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <AccountMenu />
          <CartSheet />
        </div>
      </div>
      <div className="container pb-3 md:hidden">
        <SearchBar placeholder="Search drones, services..." />
      </div>
      <div className="container hidden h-11 items-center border-t lg:flex">
        <MegaMenu items={NAV_ITEMS} linkAs={NavLink} />
      </div>
    </header>
  );
}
