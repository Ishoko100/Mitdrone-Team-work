'use client';

import { useAuth } from '@mitdrone/auth';
import { Button } from '@mitdrone/ui';
import Link from 'next/link';

export function ReferralCta() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? (
    <Button asChild size="lg">
      <Link href="/account/referrals">Open My Referrals</Link>
    </Button>
  ) : (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="lg">
        <Link href="/register">Join and get your link</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/login?next=/account/referrals">Sign in</Link>
      </Button>
    </div>
  );
}
