import { buildCategories, buildServiceCategories } from './catalog';
import {
  applyAggregates,
  buildDisputes,
  buildFinance,
  buildOrders,
  buildProducts,
  buildReviews,
  countCategoryProducts,
} from './commerce';
import {
  buildAuditLogs,
  buildContentPages,
  buildLive,
  buildNotifications,
  buildReferrals,
  buildServiceRequests,
  buildServices,
  buildSettings,
} from './extras';
import { buildKyc, buildManufacturers, buildUsers, buildVendors } from './people';
import { seedFaker } from './rng';

import type {
  AuditLog,
  Category,
  ContentPage,
  Customer,
  Dispute,
  LedgerEntry,
  LiveChatMessage,
  LiveSession,
  Manufacturer,
  Notification,
  Order,
  Payment,
  PlatformSettings,
  Payout,
  Product,
  ReferralSummary,
  Review,
  ServiceCategory,
  ServiceListing,
  ServiceQuote,
  ServiceRequest,
  User,
  Vendor,
  VendorBalance,
  VendorKYC,
} from '@mitdrone/types';

export interface Seed {
  users: User[];
  vendors: Vendor[];
  kyc: VendorKYC[];
  manufacturers: Manufacturer[];
  categories: Category[];
  serviceCategories: ServiceCategory[];
  products: Product[];
  services: ServiceListing[];
  serviceRequests: ServiceRequest[];
  serviceQuotes: ServiceQuote[];
  orders: Order[];
  payments: Payment[];
  reviews: Review[];
  disputes: Dispute[];
  payouts: Payout[];
  ledger: LedgerEntry[];
  balances: VendorBalance[];
  liveSessions: LiveSession[];
  liveMessages: LiveChatMessage[];
  referrals: Record<string, ReferralSummary>;
  notifications: Notification[];
  contentPages: ContentPage[];
  settings: PlatformSettings;
  auditLogs: AuditLog[];
}

/** Builds a fresh, deterministic, internally consistent dataset. Safe to mutate. */
export function createSeed(): Seed {
  seedFaker();
  const categories = buildCategories();
  const serviceCategories = buildServiceCategories();
  const vendors = buildVendors();
  const manufacturers = buildManufacturers();
  const users = buildUsers(vendors);
  const customers = users.filter((u): u is Customer => u.role === 'customer');
  const products = buildProducts(vendors, manufacturers);
  const { orders, payments } = buildOrders(products, vendors, customers);
  const reviews = buildReviews(products, vendors, customers, orders);
  applyAggregates(products, vendors, manufacturers, reviews, orders);
  countCategoryProducts(categories, products);
  const { payouts, ledger, balances } = buildFinance(vendors, orders);
  const { requests, quotes } = buildServiceRequests();
  const { sessions, messages } = buildLive(products);

  return {
    users,
    vendors,
    kyc: buildKyc(vendors),
    manufacturers,
    categories,
    serviceCategories,
    products,
    services: buildServices(vendors),
    serviceRequests: requests,
    serviceQuotes: quotes,
    orders,
    payments,
    reviews,
    disputes: buildDisputes(orders),
    payouts,
    ledger,
    balances,
    liveSessions: sessions,
    liveMessages: messages,
    referrals: buildReferrals(),
    notifications: buildNotifications(),
    contentPages: buildContentPages(),
    settings: buildSettings(),
    auditLogs: buildAuditLogs(),
  };
}
