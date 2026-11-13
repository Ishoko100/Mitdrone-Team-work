/**
 * Backend-native API route paths derived from the live OpenAPI specification
 * (https://mitdrone.vercel.app/docs/openapi.json).
 *
 * These paths are relative to the `/api/v1` base URL. The SDK `ApiClient`
 * prepends `baseUrl` (which ends in `/api/v1`), so paths here must NOT repeat
 * the prefix. Health endpoints live outside `/api/v1` under `/health`.
 *
 * Do not invent paths — every path below exists in the live specification.
 */

export const HEALTH_PREFIX = '/health';

export const backendRoutes = {
  auth: {
    registrationTerms: '/auth/registration-terms',
    register: '/auth/register',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    login: '/auth/login',
    session: '/auth/session',
    logout: '/auth/logout',
    logoutAll: '/auth/logout-all',
    changePassword: '/auth/change-password',
  },
  organizations: {
    list: '/organizations',
    detail: (id: string) => `/organizations/${id}`,
    applications: '/organizations/applications',
    serviceProviderApplications: '/organizations/service-provider-applications',
    application: (id: string) => `/organizations/${id}/application`,
    serviceProviderApplication: (id: string) =>
      `/organizations/${id}/service-provider-application`,
    memberships: (id: string) => `/organizations/${id}/memberships`,
    membership: (id: string, userId: string) =>
      `/organizations/${id}/memberships/${userId}`,
  },
  orgReview: {
    queue: '/admin/organizations',
    review: (id: string) => `/admin/organizations/${id}/review`,
    suspend: (id: string) => `/admin/organizations/${id}/suspend`,
  },
  catalog: {
    offers: '/catalog/offers',
    products: '/catalog/products',
    availability: (offerId: string) => `/catalog/offers/${offerId}/availability`,
  },
  vendorOffers: {
    list: (organizationId: string) =>
      `/organizations/${organizationId}/offers`,
    create: (organizationId: string) =>
      `/organizations/${organizationId}/offers`,
    detail: (organizationId: string, id: string) =>
      `/organizations/${organizationId}/offers/${id}`,
    submit: (organizationId: string, id: string) =>
      `/organizations/${organizationId}/offers/${id}/submit`,
    archive: (organizationId: string, id: string) =>
      `/organizations/${organizationId}/offers/${id}/archive`,
  },
  inventory: {
    stock: (organizationId: string, offerId: string) =>
      `/organizations/${organizationId}/offers/${offerId}/stock`,
    stockAdjustments: (organizationId: string, offerId: string) =>
      `/organizations/${organizationId}/offers/${offerId}/stock/adjustments`,
    rentalTerms: (organizationId: string, offerId: string) =>
      `/organizations/${organizationId}/offers/${offerId}/rental-terms`,
    assets: (organizationId: string) =>
      `/organizations/${organizationId}/assets`,
    asset: (organizationId: string, id: string) =>
      `/organizations/${organizationId}/assets/${id}`,
    assetBlocks: (organizationId: string, id: string) =>
      `/organizations/${organizationId}/assets/${id}/blocks`,
    assetBlock: (organizationId: string, id: string, blockId: string) =>
      `/organizations/${organizationId}/assets/${id}/blocks/${blockId}`,
    assetCalendar: (organizationId: string, id: string) =>
      `/organizations/${organizationId}/assets/${id}/calendar`,
  },
  staffCatalog: {
    createProduct: '/admin/products',
    offerQueue: '/admin/offers',
    reviewOffer: (id: string) => `/admin/offers/${id}/review`,
    checkoutTerms: (offerId: string) => `/staff/offers/${offerId}/checkout-terms`,
  },
  reservations: {
    list: '/reservations',
    create: '/reservations',
    detail: (id: string) => `/reservations/${id}`,
    release: (id: string) => `/reservations/${id}/release`,
    checkoutQuote: (id: string) => `/reservations/${id}/checkout`,
  },
  orders: {
    list: '/orders',
    create: '/orders',
    detail: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
  },
  health: {
    live: '/health/live',
    ready: '/health/ready',
  },
} as const;
