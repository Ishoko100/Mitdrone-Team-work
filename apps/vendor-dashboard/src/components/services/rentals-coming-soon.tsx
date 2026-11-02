'use client';

import { Button, PageHeader, toast } from '@mitdrone/ui';
import { CalendarClock, Check } from 'lucide-react';
import { useState } from 'react';

const ITEMS = [
  'List your drone for daily, weekly or monthly rental',
  'Set deposits, minimum days and availability calendars',
  'Approve or decline rental requests',
  'Get paid after each completed rental',
];

/** "List Your Drone for Rent" is intentionally gated until the rentals marketplace launches. */
export function RentalsComingSoon() {
  const [joined, setJoined] = useState(false);
  return (
    <>
      <PageHeader title="Rentals" description="Earn from drones that sit idle." />
      <div className="bg-card max-w-2xl space-y-5 rounded-2xl border p-8">
        <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-xl">
          <CalendarClock className="size-6" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-semibold tracking-tight">
          List Your Drone for Rent is coming soon
        </h2>
        <ul className="space-y-2">
          {ITEMS.map((i) => (
            <li key={i} className="flex gap-2 text-sm">
              <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {i}
            </li>
          ))}
        </ul>
        <Button
          disabled={joined}
          onClick={() => {
            setJoined(true);
            toast.success('You are on the waitlist', {
              description: 'We will email you when rentals open.',
            });
          }}
        >
          {joined ? 'You are on the waitlist' : 'Join the waitlist'}
        </Button>
      </div>
    </>
  );
}
