'use client';

import { useAuth } from '@mitdrone/auth';
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Skeleton,
  toast,
} from '@mitdrone/ui';
import { initials } from '@mitdrone/utils';
import {
  Gift,
  Heart,
  LogOut,
  Package,
  PackageCheck,
  RotateCcw,
  Settings,
  Store,
  User,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { env } from '@/lib/env';

export function AccountMenu() {
  const { status, user, logout } = useAuth();
  const router = useRouter();
  const [guestMenuOpen, setGuestMenuOpen] = useState(false);

  if (status === 'loading') return <Skeleton className="size-10 rounded-full" />;
  if (!user) {
    return (
      <DropdownMenu open={guestMenuOpen} onOpenChange={setGuestMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-2 px-2 py-1 text-left hover:bg-transparent"
            onMouseEnter={() => setGuestMenuOpen(true)}
          >
            <UserRound className="size-6 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-normal">Welcome</span>
              <span className="text-xs font-semibold">Sign in / Register</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="w-[min(19rem,calc(100vw-1rem))] max-h-[calc(100vh-5rem)] overflow-y-auto rounded-3xl border-0 bg-white p-4 text-[#222] shadow-xl dark:bg-white dark:text-[#222]"
          onMouseEnter={() => setGuestMenuOpen(true)}
          onMouseLeave={() => setGuestMenuOpen(false)}
        >
          <div className="space-y-0.5 pb-3">
            <Button
              asChild
              className="h-12 w-full rounded-full bg-primary text-base font-semibold text-white shadow-none hover:bg-[hsl(173,76%,23%)]"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Link
              href="/register"
              className="flex items-center justify-center h-9 rounded-full text-center text-sm text-[#777] hover:text-[#171717] hover:bg-primary/20"
            >
              Register
            </Link>
          </div>
          <DropdownMenuSeparator className="my-2 bg-[#e5e5e5]" />
          <nav aria-label="Account links" className="space-y-0.5 py-1">
            <DropdownMenuItem asChild>
              <Link
                href="/account/orders"
                className="h-10 rounded-md px-2.5 text-[15px] text-[#454545] focus:bg-[#f3f3f3] focus:text-[#171717]"
              >
                <Package /> My Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/wishlist"
                className="h-10 rounded-md px-2.5 text-[15px] text-[#454545] focus:bg-[#f3f3f3] focus:text-[#171717]"
              >
                <Heart /> Wish List
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/support/track-order"
                className="h-10 rounded-md px-2.5 text-[15px] text-[#454545] focus:bg-[#f3f3f3] focus:text-[#171717]"
              >
                <PackageCheck /> Track My Orders
              </Link>
            </DropdownMenuItem>
          </nav>
          <DropdownMenuSeparator className="my-2 bg-[#e5e5e5]" />
          <nav aria-label="More account links" className="space-y-0.5 py-1">
            <DropdownMenuItem asChild>
              <Link
                href="/account"
                className="h-10 rounded-md px-2.5 text-[15px] text-[#777] focus:bg-[#f3f3f3] focus:text-[#171717]"
              >
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={`${env.NEXT_PUBLIC_VENDOR_URL}/login`}
                className="h-10 rounded-md px-2.5 text-[15px] text-[#777] focus:bg-[#f3f3f3] focus:text-[#171717]"
              >
                <Store /> Seller Log in
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/support/returns"
                className="h-10 rounded-md px-2.5 text-[15px] text-[#777] focus:bg-[#f3f3f3] focus:text-[#171717]"
              >
                <RotateCcw /> Return &amp; refund policy
              </Link>
            </DropdownMenuItem>
          </nav>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-8">
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User /> My account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">
            <Package /> Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/support/track-order">
            <Package /> Track my Order
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Heart /> Wishlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/referrals">
            <Gift /> Referrals
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await logout();
            toast.success('You have been signed out');
            router.push('/');
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
