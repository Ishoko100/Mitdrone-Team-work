'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Money } from '@mitdrone/types';

export interface CartLine {
  /** productId + variantId, so the same product in two variants is two lines. */
  key: string;
  productId: string;
  variantId?: string;
  vendorId: string;
  title: string;
  slug: string;
  imageUrl?: string;
  unitPrice: Money;
  quantity: number;
  maxQuantity: number;
}

export type NewCartLine = Omit<CartLine, 'key' | 'quantity'>;

interface CartState {
  lines: CartLine[];
  /** False until localStorage has been read (avoids server/client hydration mismatches). */
  hydrated: boolean;
  add: (line: NewCartLine, quantity?: number) => { quantity: number; capped: boolean };
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const lineKey = (productId: string, variantId?: string): string =>
  `${productId}:${variantId ?? 'base'}`;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      hydrated: false,
      add: (line, quantity = 1) => {
        const key = lineKey(line.productId, line.variantId);
        const existing = get().lines.find((l) => l.key === key);
        const wanted = (existing?.quantity ?? 0) + quantity;
        const finalQty = Math.max(1, Math.min(wanted, line.maxQuantity));
        set((state) => ({
          lines: existing
            ? state.lines.map((l) =>
                l.key === key
                  ? {
                      ...l,
                      quantity: finalQty,
                      maxQuantity: line.maxQuantity,
                      unitPrice: line.unitPrice,
                    }
                  : l,
              )
            : [...state.lines, { ...line, key, quantity: finalQty }],
        }));
        return { quantity: finalQty, capped: finalQty < wanted };
      },
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) =>
                  l.key === key ? { ...l, quantity: Math.min(quantity, l.maxQuantity) } : l,
                ),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: 'mitdrone.cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
      onRehydrateStorage: () => () => useCartStore.setState({ hydrated: true }),
    },
  ),
);

export const cartCount = (lines: readonly CartLine[]): number =>
  lines.reduce((sum, l) => sum + l.quantity, 0);
export const cartSubtotal = (lines: readonly CartLine[]): number =>
  lines.reduce((sum, l) => sum + l.unitPrice.amount * l.quantity, 0);

/** Item count that is 0 until hydrated, so server and first client render match. */
export const useCartCount = (): number =>
  useCartStore((s) => (s.hydrated ? cartCount(s.lines) : 0));
