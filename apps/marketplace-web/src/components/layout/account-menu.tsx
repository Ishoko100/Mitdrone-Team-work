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
import { Bookmark, Gift, Heart, LogOut, Package, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
            My Account
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={0}
          className="w-56"
          onMouseEnter={() => setGuestMenuOpen(true)}
          onMouseLeave={() => setGuestMenuOpen(false)}
        >
          <DropdownMenuItem asChild>
            <Link href="/login">
              <User /> Login / Sign up my Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/orders">
              <Package /> My Orders
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <Bookmark /> Saved items
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
          <Link href="/account">
            <Bookmark /> Saved items
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
