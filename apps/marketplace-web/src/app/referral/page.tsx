import { Gift, ShoppingBag, Share2 } from 'lucide-react';

import { ReferralCta } from '@/components/common/referral-cta';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Referral and earn',
  description: 'Share Mitdrone, and earn a reward when someone you refer buys.',
};

const STEPS = [
  {
    icon: Share2,
    title: 'Share Mitdrone',
    text: 'Share your referral link with friends, colleagues and fellow pilots.',
  },
  { icon: ShoppingBag, title: 'Someone buys', text: 'They complete a qualifying transaction.' },
  { icon: Gift, title: 'You earn', text: 'Receive your referral reward.' },
];

export default function ReferralPage() {
  return (
    <div className="container max-w-4xl space-y-10 py-12">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Share Mitdrone. Earn rewards.</h1>
        <p className="text-muted-foreground text-lg">
          Track everyone you refer, their purchases and your rewards in My Referrals.
        </p>
      </header>
      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="bg-card shadow-soft space-y-3 rounded-xl border p-5">
            <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="font-semibold">
              <span className="sr-only">Step {i + 1}: </span>
              {title}
            </h2>
            <p className="text-muted-foreground text-sm">{text}</p>
          </li>
        ))}
      </ol>
      <ReferralCta />
    </div>
  );
}
