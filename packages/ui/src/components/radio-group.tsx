'use client';

import * as RadioPrimitive from '@radix-ui/react-radio-group';

import { cn } from '../lib/cn';

import type { ComponentProps } from 'react';

export function RadioGroup({ className, ...props }: ComponentProps<typeof RadioPrimitive.Root>) {
  return <RadioPrimitive.Root className={cn('grid gap-2', className)} {...props} />;
}

export function RadioGroupItem({
  className,
  ...props
}: ComponentProps<typeof RadioPrimitive.Item>) {
  return (
    <RadioPrimitive.Item
      className={cn(
        'border-input bg-background text-primary data-[state=checked]:border-primary aspect-square size-5 rounded-full border disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator className="flex items-center justify-center">
        <span className="bg-primary size-2.5 rounded-full" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Item>
  );
}
