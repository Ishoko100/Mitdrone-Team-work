/**
 * Single source of truth for API paths. Used by the SDK (to call) and by the MSW
 * handlers (to mock), so the two can never drift. Backend devs: implement these.
 * Vendor-scoped routes live under /vendors/:vendorId/... and are rejected with 403
 * when :vendorId does not match the authenticated user's vendorId.
 */
export const API_PREFIX = '/api/v1';

export const routes = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    me: '/auth/me',
  },
  catalog: {
    products: '/products',
    product: '/products/:idOrSlug',
    productReviews: '/products/:id/reviews',
    categories: '/categories',
    vendors: '/vendors',
    vendor: '/vendors/:slug',
    manufacturers: '/manufacturers',
    manufacturer: '/manufacturers/:slug',
    search: '/search',
  },
  services: {
    categories: '/service-categories',
    list: '/services',
    detail: '/services/:slug',
    requests: '/service-requests',
    requestQuotes: '/service-requests/:id/quotes',
  },
  checkout: {
    quote: '/cart/quote',
    paymentIntent: '/checkout/payment-intent',
    confirm: '/checkout/confirm',
  },
  me: {
    profile: '/me',
    orders: '/me/orders',
    order: '/me/orders/:id',
    addresses: '/me/addresses',
    address: '/me/addresses/:id',
    referrals: '/me/referrals',
    notifications: '/me/notifications',
    notificationRead: '/me/notifications/:id/read',
  },
  live: {
    sessions: '/live/sessions',
    session: '/live/sessions/:id',
    messages: '/live/sessions/:id/messages',
  },
  content: {
    pages: '/content/pages',
    page: '/content/pages/:slug',
    businessQuote: '/business/quotes',
  },
  seller: {
    dashboard: '/vendors/:vendorId/dashboard',
    analytics: '/vendors/:vendorId/analytics',
    settings: '/vendors/:vendorId/settings',
    products: '/vendors/:vendorId/products',
    product: '/vendors/:vendorId/products/:id',
    productsBulk: '/vendors/:vendorId/products/bulk',
    orders: '/vendors/:vendorId/orders',
    order: '/vendors/:vendorId/orders/:id',
    ordersBulk: '/vendors/:vendorId/orders/bulk',
    orderStatus: '/vendors/:vendorId/orders/:id/status',
    inventory: '/vendors/:vendorId/inventory',
    inventoryItem: '/vendors/:vendorId/inventory/:productId',
    payouts: '/vendors/:vendorId/payouts',
    balance: '/vendors/:vendorId/balance',
    ledger: '/vendors/:vendorId/ledger',
    bank: '/vendors/:vendorId/bank',
    kyc: '/vendors/:vendorId/kyc',
    kycSubmit: '/vendors/:vendorId/kyc/submit',
    services: '/vendors/:vendorId/services',
    serviceRequests: '/vendors/:vendorId/service-requests',
    serviceQuote: '/vendors/:vendorId/service-requests/:id/quotes',
  },
  admin: {
    dashboard: '/admin/dashboard',
    vendors: '/admin/vendors',
    vendor: '/admin/vendors/:id',
    vendorApprove: '/admin/vendors/:id/approve',
    vendorReject: '/admin/vendors/:id/reject',
    vendorSuspend: '/admin/vendors/:id/suspend',
    products: '/admin/products',
    productApprove: '/admin/products/:id/approve',
    productFlag: '/admin/products/:id/flag',
    product: '/admin/products/:id',
    orders: '/admin/orders',
    order: '/admin/orders/:id',
    orderRefund: '/admin/orders/:id/refund',
    disputes: '/admin/disputes',
    dispute: '/admin/disputes/:id',
    disputeAssign: '/admin/disputes/:id/assign',
    disputeMessages: '/admin/disputes/:id/messages',
    disputeResolve: '/admin/disputes/:id/resolve',
    payouts: '/admin/payouts',
    payoutProcess: '/admin/payouts/:id/process',
    payoutHold: '/admin/payouts/:id/hold',
    users: '/admin/users',
    user: '/admin/users/:id',
    settings: '/admin/settings',
    auditLogs: '/admin/audit-logs',
    exports: '/admin/exports',
  },
} as const;

/** Replaces :params in a route pattern. Values are URI-encoded. */
export function buildPath(pattern: string, params: Record<string, string> = {}): string {
  return pattern.replace(/:([A-Za-z]+)/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined) throw new Error(`Missing route param "${key}" for ${pattern}`);
    return encodeURIComponent(value);
  });
}
