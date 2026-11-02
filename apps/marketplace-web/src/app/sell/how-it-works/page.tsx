import { Button } from '@mitdrone/ui';
import { SELLING_STEPS } from '@mitdrone/utils';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { env } from '@/lib/env';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How selling works',
  description: 'Six simple steps from account to payout.',
};

const DETAIL = [
  'Sign up as an individual seller, dealer or manufacturer. It takes two minutes.',
  'Upload your ID and business documents (and NCAA permit where relevant). We review within two business days.',
  'Add clear photos, an honest condition, price and stock. New listings are checked before they go live.',
  'Your products appear in search, categories, deals and Mitdrone Live to verified buyers.',
  'Ship with tracking. Buyers confirm delivery, and Buyer Protection covers disputes.',
  'Payouts go to your bank account on the platform schedule, minus the commission.',
];

export default function HowItWorksPage() {
  return (
    <div className="container max-w-3xl space-y-8 py-10">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Sell', href: '/sell' },
            { label: 'How it works' },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">How selling works</h1>
      </div>
      <ol className="space-y-6">
        {SELLING_STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span
              className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full font-semibold"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="text-muted-foreground">{DETAIL[i]}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button asChild size="lg">
        <a href={`${env.NEXT_PUBLIC_VENDOR_URL}/register`}>List Your Drone</a>
      </Button>
    </div>
  );
}
