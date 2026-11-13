import { z } from 'zod';

import type { ID, Money, PageParams, Paginated } from './common';
import type { Dispute } from './dispute';
import type { Manufacturer } from './manufacturer';
import type { Order, OrderStatus } from './order';
import type { Payment } from './payment';
import type { Payout } from './payout';
import type { Category, Product } from './product';
import type { ServiceListing } from './service';
import type { User } from './user';
import type { Vendor, VendorKYC, VendorStats } from './vendor';

/* ---------- Errors ---------- */
export interface ApiErrorBody {
  code: string;
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}

/* ---------- Auth ---------- */
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
export type LoginRequest = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email('Enter a valid email').max(254),
    acceptedTerms: z.boolean().refine((accepted) => accepted, {
      message: 'Accept the terms to continue',
    }),
    termsVersion: z.string().min(1),
    fullName: z.string().min(2, 'Enter your full name'),
    phone: z.string().min(1, 'Enter your phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    confirmPassword: z.string().max(128),
    displayName: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type RegisterRequest = z.infer<typeof registerSchema>;

export interface RegistrationTerms {
  buyer: string;
  vendor: string;
  serviceProvider: string;
}

export const verifyEmailSchema = z.object({
  token: z.string().length(43),
  password: z.string().min(1, 'Enter the password used at registration').max(128),
});
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;

export const emailRequestSchema = z.object({
  email: z.string().email('Enter a valid email').max(254),
});
export type EmailRequest = z.infer<typeof emailRequestSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().length(43),
  password: z.string().min(1).max(128),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(15, 'Password must be at least 15 characters').max(128),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;

/* ---------- Forms shared across apps ---------- */
export const addressSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  line1: z.string().min(3, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  state: z.string().min(2, 'Required'),
  postalCode: z.string().optional(),
  country: z.string().default('NG'),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const productFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(120),
  shortDescription: z.string().min(10).max(240),
  description: z.string().min(20, 'Add a fuller description'),
  kind: z.enum(['drone', 'accessory', 'spare_part', 'payload', 'equipment']),
  listingType: z.enum(['sale', 'rent']),
  condition: z.enum(['new', 'used', 'refurbished']),
  brand: z.string().min(1, 'Required'),
  categoryIds: z.array(z.string()).min(1, 'Pick at least one category'),
  /** Major units in the form (₦), converted to minor units by the SDK. */
  priceMajor: z.coerce.number().positive('Enter a price'),
  compareAtPriceMajor: z.coerce.number().positive().optional(),
  sku: z.string().min(2),
  quantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(2),
  tags: z.array(z.string()).default([]),
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

export const quoteRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, 'Tell us a little more'),
  quantity: z.coerce.number().int().positive().optional(),
});
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const serviceRequestSchema = z.object({
  categoryId: z.string().min(1, 'Choose a service'),
  title: z.string().min(5),
  description: z.string().min(20),
  state: z.string().min(2, 'Choose a state'),
  city: z.string().optional(),
  areaHectares: z.coerce.number().positive().optional(),
  budgetMajor: z.coerce.number().positive().optional(),
  neededBy: z.string().optional(),
});
export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;

/* ---------- Checkout ---------- */
export interface CreatePaymentIntentRequest {
  cartId?: ID;
  items: { productId: ID; variantId?: ID; quantity: number }[];
  shippingAddress: AddressInput;
}

/* ---------- Dashboards ---------- */
export interface TimeSeriesPoint {
  date: string;
  value: number;
}
export interface VendorDashboardData {
  revenue: Money;
  orders: number;
  conversionRate: number;
  salesSeries: TimeSeriesPoint[];
  topProducts: { productId: ID; title: string; units: number; revenue: Money }[];
}
export interface AdminDashboardData {
  gmv: Money;
  activeVendors: number;
  pendingVendors: number;
  orders: number;
  openDisputes: number;
  gmvSeries: TimeSeriesPoint[];
}

/* ---------- Generic list helpers ---------- */
export interface ListQuery extends PageParams {
  [filter: string]: string | number | boolean | undefined;
}
export type ListResponse<T> = Paginated<T>;

/* ---------- Search ---------- */
export interface SearchResults {
  products: Product[];
  vendors: Vendor[];
  manufacturers: Manufacturer[];
  services: ServiceListing[];
  categories: Category[];
}

/* ---------- Cart and checkout ---------- */
export interface CartQuoteRequest {
  items: { productId: ID; variantId?: ID; quantity: number }[];
  couponCode?: string;
}
export interface ConfirmCheckoutRequest extends CreatePaymentIntentRequest {
  paymentIntentId: string;
  couponCode?: string;
  /** Mock only. A card ending 0002 is declined to demo the error path. */
  paymentMethod?: { last4?: string; brand?: string };
}

/* ---------- Vendor ---------- */
export interface VendorAnalytics {
  range: '7d' | '30d' | '90d';
  revenueSeries: TimeSeriesPoint[];
  ordersSeries: TimeSeriesPoint[];
  visitsSeries: TimeSeriesPoint[];
  conversionRate: number;
  averageOrderValue: Money;
  categoryBreakdown: { name: string; value: number }[];
  topProducts: VendorDashboardData['topProducts'];
}
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  note?: string;
}
export interface BulkActionRequest {
  ids: ID[];
  action: string;
}

/* ---------- Admin ---------- */
export interface ModerationRequest {
  reason?: string;
}
export interface RefundRequest {
  reason: string;
}
export interface ResolveDisputeRequest {
  outcome: 'refund' | 'no_refund';
  resolution: string;
}
export interface AdminVendorDetail {
  vendor: Vendor;
  owner?: User;
  kyc?: VendorKYC;
  stats: VendorStats;
  recentOrders: Order[];
  payouts: Payout[];
  products: Product[];
}
export interface AdminOrderDetail {
  order: Order;
  payment?: Payment;
  disputes: Dispute[];
}
