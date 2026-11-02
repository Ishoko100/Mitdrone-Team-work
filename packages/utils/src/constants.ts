import type { CurrencyCode, OrderStatus } from '@mitdrone/types';

export const APP_NAME = 'Mitdrone';
export const DEFAULT_CURRENCY: CurrencyCode = 'NGN';
export const DEFAULT_LOCALE = 'en-NG';
export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['NGN', 'USD', 'GBP', 'EUR'];
export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

/** Price buckets used by the Shop and Offers menus. Values in kobo (minor units). */
export const PRICE_RANGES = [
  { id: 'under-500k', label: 'Under ₦500K', min: 0, max: 500_000_00 },
  { id: '500k-1m', label: '₦500K to ₦1M', min: 500_000_00, max: 1_000_000_00 },
  { id: '1m-3m', label: '₦1M to ₦3M', min: 1_000_000_00, max: 3_000_000_00 },
  { id: '3m-5m', label: '₦3M to ₦5M', min: 3_000_000_00, max: 5_000_000_00 },
  { id: '5m-plus', label: '₦5M+', min: 5_000_000_00, max: undefined },
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT Abuja',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export const SELLING_STEPS = [
  {
    title: 'Create account',
    description: 'Sign up as an individual seller, dealer or manufacturer.',
  },
  {
    title: 'Verify yourself',
    description: 'Submit KYC documents so buyers can trust your listings.',
  },
  { title: 'List your product', description: 'Add photos, pricing, condition and stock.' },
  { title: 'Get buyers', description: 'Reach verified buyers across Nigeria and Africa.' },
  { title: 'Complete transaction', description: 'Ship the order and confirm delivery.' },
  { title: 'Get paid', description: 'Receive payouts to your bank account.' },
] as const;
