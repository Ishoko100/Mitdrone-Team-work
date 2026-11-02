import type { OrderStatus } from '@mitdrone/types';

/** Mirrors the transitions the API allows, so the UI only offers valid next steps. */
export const NEXT_ACTIONS: Record<
  OrderStatus,
  { status: OrderStatus; label: string; needsTracking?: boolean; destructive?: boolean }[]
> = {
  pending: [{ status: 'cancelled', label: 'Cancel order', destructive: true }],
  paid: [
    { status: 'processing', label: 'Start processing' },
    { status: 'cancelled', label: 'Cancel order', destructive: true },
  ],
  processing: [
    { status: 'shipped', label: 'Mark as shipped', needsTracking: true },
    { status: 'cancelled', label: 'Cancel order', destructive: true },
  ],
  shipped: [{ status: 'delivered', label: 'Mark as delivered' }],
  delivered: [],
  completed: [],
  cancelled: [],
  refunded: [],
};

export const CARRIERS = [
  'GIG Logistics',
  'DHL',
  'Kwik Delivery',
  'Bolt Delivery',
  'Seller delivery',
];
