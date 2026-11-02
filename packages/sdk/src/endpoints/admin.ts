import {
  routes,
  type AdminDashboardData,
  type AdminOrderDetail,
  type AdminVendorDetail,
  type AuditAction,
  type AuditEntityType,
  type AuditLog,
  type Dispute,
  type DisputeStatus,
  type Order,
  type OrderStatus,
  type PageParams,
  type Paginated,
  type PlatformSettings,
  type Payout,
  type PayoutStatus,
  type Product,
  type ProductFilters,
  type Role,
  type User,
  type Vendor,
  type VendorStatus,
} from '@mitdrone/types';

import type { ApiClient } from '../client';

export const adminEndpoints = (c: ApiClient) => ({
  dashboard: () => c.request<AdminDashboardData>('GET', routes.admin.dashboard),

  vendors: (query: PageParams & { status?: VendorStatus; type?: string } = {}) =>
    c.request<Paginated<Vendor>>('GET', routes.admin.vendors, { query }),
  vendor: (id: string) =>
    c.request<AdminVendorDetail>('GET', routes.admin.vendor, { params: { id } }),
  approveVendor: (id: string) =>
    c.request<Vendor>('POST', routes.admin.vendorApprove, { params: { id }, body: {} }),
  rejectVendor: (id: string, reason: string) =>
    c.request<Vendor>('POST', routes.admin.vendorReject, { params: { id }, body: { reason } }),
  suspendVendor: (id: string, reason: string) =>
    c.request<Vendor>('POST', routes.admin.vendorSuspend, { params: { id }, body: { reason } }),

  products: (query: ProductFilters & PageParams = {}) =>
    c.request<Paginated<Product>>('GET', routes.admin.products, { query }),
  approveProduct: (id: string) =>
    c.request<Product>('POST', routes.admin.productApprove, { params: { id } }),
  flagProduct: (id: string, reason: string) =>
    c.request<Product>('POST', routes.admin.productFlag, { params: { id }, body: { reason } }),
  deleteProduct: (id: string) =>
    c.request<void>('DELETE', routes.admin.product, { params: { id } }),

  orders: (query: PageParams & { status?: OrderStatus } = {}) =>
    c.request<Paginated<Order>>('GET', routes.admin.orders, { query }),
  order: (id: string) => c.request<AdminOrderDetail>('GET', routes.admin.order, { params: { id } }),
  refundOrder: (id: string, reason: string) =>
    c.request<Order>('POST', routes.admin.orderRefund, { params: { id }, body: { reason } }),

  disputes: (query: PageParams & { status?: DisputeStatus } = {}) =>
    c.request<Paginated<Dispute>>('GET', routes.admin.disputes, { query }),
  dispute: (id: string) => c.request<Dispute>('GET', routes.admin.dispute, { params: { id } }),
  assignDispute: (id: string) =>
    c.request<Dispute>('POST', routes.admin.disputeAssign, { params: { id } }),
  messageDispute: (id: string, body: string) =>
    c.request<Dispute['messages'][number]>('POST', routes.admin.disputeMessages, {
      params: { id },
      body: { body },
    }),
  resolveDispute: (id: string, body: { outcome: 'refund' | 'no_refund'; resolution: string }) =>
    c.request<Dispute>('POST', routes.admin.disputeResolve, { params: { id }, body }),

  payouts: (query: PageParams & { status?: PayoutStatus; vendorId?: string } = {}) =>
    c.request<Paginated<Payout>>('GET', routes.admin.payouts, { query }),
  processPayout: (id: string) =>
    c.request<Payout>('POST', routes.admin.payoutProcess, { params: { id } }),
  holdPayout: (id: string, reason?: string) =>
    c.request<Payout>('POST', routes.admin.payoutHold, { params: { id }, body: { reason } }),

  users: (query: PageParams & { role?: Role; status?: string } = {}) =>
    c.request<Paginated<User>>('GET', routes.admin.users, { query }),
  createUser: (body: { name: string; email: string; role: 'admin' | 'super_admin' | 'support' }) =>
    c.request<User>('POST', routes.admin.users, { body }),
  updateUser: (id: string, body: { role?: Role; status?: 'active' | 'suspended' }) =>
    c.request<User>('PATCH', routes.admin.user, { params: { id }, body }),

  settings: () => c.request<PlatformSettings>('GET', routes.admin.settings),
  updateSettings: (body: Partial<Omit<PlatformSettings, 'updatedAt' | 'updatedBy'>>) =>
    c.request<PlatformSettings>('PUT', routes.admin.settings, { body }),
  auditLogs: (
    query: PageParams & {
      action?: AuditAction;
      entityType?: AuditEntityType;
      actorId?: string;
    } = {},
  ) => c.request<Paginated<AuditLog>>('GET', routes.admin.auditLogs, { query }),
  recordExport: (body: { entity: string; format: 'csv' | 'pdf'; rowCount: number }) =>
    c.request<{ ok: boolean }>('POST', routes.admin.exports, { body }),
});
