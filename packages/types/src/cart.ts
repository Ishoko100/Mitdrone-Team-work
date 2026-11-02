import type { ID, Money } from './common';

export interface CartItem {
  id: ID;
  productId: ID;
  variantId?: ID;
  vendorId: ID;
  title: string;
  slug: string;
  imageUrl?: string;
  unitPrice: Money;
  quantity: number;
  maxQuantity: number;
}

export interface Cart {
  id: ID;
  items: CartItem[];
  subtotal: Money;
  shipping: Money;
  tax: Money;
  discount: Money;
  total: Money;
  couponCode?: string;
}
