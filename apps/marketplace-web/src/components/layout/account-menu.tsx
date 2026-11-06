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
  BriefcaseBusiness,
  ChevronRight,
  Gift,
  Heart,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  User,
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
            variant="outline"
            size="sm"
            className="border-primary bg-primary text-white hover:bg-primary/90 hover:text-white"
            onMouseEnter={() => setGuestMenuOpen(true)}
          >
            Sign in/Register
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={0}
          className="w-[min(22rem,calc(100vw-2rem))] p-0"
          onMouseEnter={() => setGuestMenuOpen(true)}
          onMouseLeave={() => setGuestMenuOpen(false)}
        >
          <div className="space-y-3 p-4">
            <div>
              <p className="font-semibold">Welcome to MITDRONE</p>
              <p className="text-muted-foreground mt-1 text-xs">Sign in to your account or create a new one.</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login"><User className="mr-2 size-4" />Sign In</Link>
            </Button>
            <div className="border-t pt-3">
              <p className="mb-2 text-sm font-semibold">Create an account</p>
              <p className="text-muted-foreground mb-2 text-xs">Choose how you want to use MITDRONE.</p>
              <div className="space-y-1">
                <Link href="/register" className="hover:bg-accent flex items-center gap-3 rounded-md p-2">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"><ShoppingBag className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Buyer</span><span className="text-muted-foreground block text-xs">Discover and purchase drones, accessories and services.</span></span>
                  <ChevronRight className="text-muted-foreground size-4" />
                </Link>
                <a href={`${env.NEXT_PUBLIC_VENDOR_URL}/register?type=seller`} className="hover:bg-accent flex items-center gap-3 rounded-md p-2">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"><Store className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Vendor</span><span className="text-muted-foreground block text-xs">List and sell drones, spare parts and accessories.</span></span>
                  <ChevronRight className="text-muted-foreground size-4" />
                </a>
                <a href={`${env.NEXT_PUBLIC_VENDOR_URL}/register?type=service_provider`} className="hover:bg-accent flex items-center gap-3 rounded-md p-2">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"><BriefcaseBusiness className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Service Provider</span><span className="text-muted-foreground block text-xs">Offer professional drone services and receive bookings.</span></span>
                  <ChevronRight className="text-muted-foreground size-4" />
                </a>
              </div>
            </div>
            <div className="flex justify-between border-t pt-2">
              <Link href="/account/orders" className="hover:text-primary flex items-center gap-1.5 text-xs"><Package className="size-3.5" />My Orders</Link>
              <Link href="/support/track-order" className="hover:text-primary flex items-center gap-1.5 text-xs"><Package className="size-3.5" />Track Order</Link>
              <Link href="/account" className="hover:text-primary flex items-center gap-1.5 text-xs"><Heart className="size-3.5" />Wishlist</Link>
            </div>
          </div>
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
