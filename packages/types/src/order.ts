import type { Address, ID, ISODateString, Money, Timestamps } from './common';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: ID;
  productId: ID;
  variantId?: ID;
  vendorId: ID;
  title: string;
  imageUrl?: string;
  sku: string;
  unitPrice: Money;
  quantity: number;
  total: Money;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  at: ISODateString;
  note?: string;
}

export interface Order extends Timestamps {
  id: ID;
  number: string;
  customerId: ID;
  customerName: string;
  customerEmail: string;
  vendorIds: ID[];
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: Address;
  subtotal: Money;
  shipping: Money;
  tax: Money;
  discount: Money;
  total: Money;
  commission: Money;
  paymentId?: ID;
  trackingNumber?: string;
  carrier?: string;
  timeline: OrderTimelineEvent[];
}
