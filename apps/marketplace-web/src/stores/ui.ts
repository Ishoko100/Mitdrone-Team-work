'use client';

import { create } from 'zustand';

interface UiState {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  /** Coupon applied in the cart, carried into checkout (not persisted). */
  couponCode: string;
  setCouponCode: (code: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  couponCode: '',
  setCouponCode: (couponCode) => set({ couponCode }),
}));
