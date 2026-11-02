'use client';

import * as P from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';

import { cn } from '../lib/cn';

import type { ComponentProps } from 'react';

export const DropdownMenu = P.Root;
export const DropdownMenuTrigger = P.Trigger;
export const DropdownMenuGroup = P.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground shadow-pop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50 min-w-[10rem] overflow-hidden rounded-lg border p-1',
          className,
        )}
        {...props}
      />
    </P.Portal>
  );
}

const itemClass =
  'relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: ComponentProps<typeof P.Item> & { destructive?: boolean }) {
  return (
    <P.Item
      className={cn(itemClass, destructive && 'text-destructive focus:text-destructive', className)}
      {...props}
    />
  );
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof P.CheckboxItem>) {
  return (
    <P.CheckboxItem className={cn(itemClass, 'pl-8', className)} {...props}>
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <P.ItemIndicator>
          <Check className="size-4" aria-hidden="true" />
        </P.ItemIndicator>
      </span>
      {children}
    </P.CheckboxItem>
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof P.Label>) {
  return (
    <P.Label
      className={cn('text-muted-foreground px-2 py-1.5 text-xs font-medium', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof P.Separator>) {
  return <P.Separator className={cn('bg-border -mx-1 my-1 h-px', className)} {...props} />;
}
