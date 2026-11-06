'use client';

import {
  Button,
  EmptyState,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@mitdrone/ui';
import { formatCurrency } from '@mitdrone/utils';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { cartSubtotal, useCartCount, useCartStore } from '@/stores/cart';
import { useUiStore } from '@/stores/ui';

export function CartSheet() {
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const count = useCartCount();
  const lines = useCartStore((s) => s.lines);
  const hydrated = useCartStore((s) => s.hydrated);
  const { setQuantity, remove } = useCartStore.getState();
  const items = hydrated ? lines : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
        >
          <ShoppingCart aria-hidden="true" />
          {count > 0 ? (
            <span className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold leading-5">
              <span key={count} className="cart-count-pop">
                {count}
              </span>
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
          <SheetDescription>
            {count === 0 ? 'Nothing here yet.' : `${count} ${count === 1 ? 'item' : 'items'}`}
          </SheetDescription>
        </SheetHeader>
        {items.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Find a drone or accessory you love."
            className="flex-1"
          />
        ) : (
          <>
            <ul className="-mx-2 flex-1 divide-y overflow-y-auto px-2">
              {items.map((line) => (
                <li key={line.key} className="flex gap-3 py-3">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={() => setOpen(false)}
                    className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-md"
                  >
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{line.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatCurrency(line.unitPrice.amount)}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        aria-label={`Decrease quantity of ${line.title}`}
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                      >
                        <Minus />
                      </Button>
                      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                        {line.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        aria-label={`Increase quantity of ${line.title}`}
                        disabled={line.quantity >= line.maxQuantity}
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                      >
                        <Plus />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground ml-auto size-8"
                        aria-label={`Remove ${line.title}`}
                        onClick={() => remove(line.key)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-base font-semibold">
                  {formatCurrency(cartSubtotal(items))}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Shipping and VAT are calculated at checkout.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link href="/cart">View cart</Link>
                </Button>
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
