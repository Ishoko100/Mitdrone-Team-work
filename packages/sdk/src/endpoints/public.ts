import {
  routes,
  type Address,
  type AddressInput,
  type CartQuoteRequest,
  type Cart,
  type Category,
  type ConfirmCheckoutRequest,
  type ContentPage,
  type ContentSection,
  type CreatePaymentIntentRequest,
  type LiveChatMessage,
  type LiveSession,
  type LiveSessionStatus,
  type LiveSessionType,
  type LoginRequest,
  type RegistrationTerms,
  type Manufacturer,
  type Notification,
  type Order,
  type PageParams,
  type Paginated,
  type PaymentIntent,
  type Product,
  type ProductFilters,
  type ProductSort,
  type QuoteRequestInput,
  type ReferralSummary,
  type RegisterRequest,
  type VerifyEmailRequest,
  type EmailRequest,
  type ResetPasswordRequest,
  type ChangePasswordRequest,
  type Review,
  type SearchResults,
  type ServiceCategory,
  type ServiceListing,
  type ServiceQuote,
  type ServiceRequest,
  type ServiceRequestInput,
  type User,
  type Vendor,
} from '@mitdrone/types';

import type { ApiClient, RequestOptions } from '../client';

export type ProductQuery = ProductFilters & PageParams & { sort?: ProductSort };
type Cache = Pick<RequestOptions, 'next' | 'signal'>;

export const publicEndpoints = (c: ApiClient) => ({
  auth: {
    registrationTerms: () =>
      c.request<RegistrationTerms>('GET', routes.auth.registrationTerms, { auth: false }),
    login: (body: LoginRequest) =>
      c.request<unknown>('POST', routes.auth.login, { body, auth: false }),
    register: (body: RegisterRequest) =>
      c.request<void>('POST', routes.auth.register, { body, auth: false }),
    verifyEmail: (body: VerifyEmailRequest) =>
      c.request<void>('POST', routes.auth.verifyEmail, { body, auth: false }),
    resendVerification: (body: EmailRequest) =>
      c.request<void>('POST', routes.auth.resendVerification, { body, auth: false }),
    logout: () => c.request<void>('POST', routes.auth.logout, { csrf: true }),
    logoutAll: () => c.request<void>('POST', routes.auth.logoutAll),
    forgotPassword: (email: string) =>
      c.request<void>('POST', routes.auth.forgotPassword, {
        body: { email },
        auth: false,
      }),
    resetPassword: (body: ResetPasswordRequest) =>
      c.request<void>('POST', routes.auth.resetPassword, { body, auth: false }),
    changePassword: (body: ChangePasswordRequest) =>
      c.request<void>('POST', routes.auth.changePassword, { body }),
    session: () => c.request<unknown>('GET', routes.auth.session),
  },

  catalog: {
    products: (query: ProductQuery = {}, o: Cache = {}) =>
      c.request<Paginated<Product>>('GET', routes.catalog.products, { query, ...o }),
    product: (idOrSlug: string, o: Cache = {}) =>
      c.request<Product>('GET', routes.catalog.product, { params: { idOrSlug }, ...o }),
    reviews: (productId: string, query: PageParams = {}) =>
      c.request<Paginated<Review>>('GET', routes.catalog.productReviews, {
        params: { id: productId },
        query,
      }),
    createReview: (productId: string, body: { rating: number; title: string; body: string }) =>
      c.request<Review>('POST', routes.catalog.productReviews, { params: { id: productId }, body }),
    categories: (query: { group?: Category['group'] } = {}, o: Cache = {}) =>
      c.request<Category[]>('GET', routes.catalog.categories, { query, ...o }),
    vendors: (query: PageParams & { type?: string; state?: string } = {}, o: Cache = {}) =>
      c.request<Paginated<Vendor>>('GET', routes.catalog.vendors, { query, ...o }),
    vendor: (slug: string, o: Cache = {}) =>
      c.request<Vendor>('GET', routes.catalog.vendor, { params: { slug }, ...o }),
    manufacturers: (query: PageParams & { nigerian?: boolean } = {}, o: Cache = {}) =>
      c.request<Paginated<Manufacturer>>('GET', routes.catalog.manufacturers, { query, ...o }),
    manufacturer: (slug: string, o: Cache = {}) =>
      c.request<Manufacturer>('GET', routes.catalog.manufacturer, { params: { slug }, ...o }),
    search: (q: string, o: Cache = {}) =>
      c.request<SearchResults>('GET', routes.catalog.search, { query: { q }, ...o }),
  },

  services: {
    categories: (o: Cache = {}) =>
      c.request<ServiceCategory[]>('GET', routes.services.categories, o),
    list: (
      query: PageParams & { category?: string; state?: string; vendor?: string } = {},
      o: Cache = {},
    ) => c.request<Paginated<ServiceListing>>('GET', routes.services.list, { query, ...o }),
    detail: (slug: string, o: Cache = {}) =>
      c.request<ServiceListing>('GET', routes.services.detail, { params: { slug }, ...o }),
    createRequest: (body: ServiceRequestInput) =>
      c.request<ServiceRequest>('POST', routes.services.requests, { body }),
    myRequests: (query: PageParams = {}) =>
      c.request<Paginated<ServiceRequest>>('GET', routes.services.requests, { query }),
    quotes: (requestId: string) =>
      c.request<ServiceQuote[]>('GET', routes.services.requestQuotes, {
        params: { id: requestId },
      }),
  },

  checkout: {
    quote: (body: CartQuoteRequest) => c.request<Cart>('POST', routes.checkout.quote, { body }),
    createPaymentIntent: (body: CreatePaymentIntentRequest) =>
      c.request<PaymentIntent>('POST', routes.checkout.paymentIntent, { body }),
    confirm: (body: ConfirmCheckoutRequest) =>
      c.request<Order>('POST', routes.checkout.confirm, { body }),
  },

  me: {
    profile: () => c.request<User>('GET', routes.me.profile),
    updateProfile: (body: { name?: string; phone?: string }) =>
      c.request<User>('PATCH', routes.me.profile, { body }),
    orders: (query: PageParams & { status?: string } = {}) =>
      c.request<Paginated<Order>>('GET', routes.me.orders, { query }),
    order: (id: string) => c.request<Order>('GET', routes.me.order, { params: { id } }),
    addresses: () => c.request<Address[]>('GET', routes.me.addresses),
    addAddress: (body: AddressInput & { isDefault?: boolean; label?: string }) =>
      c.request<Address>('POST', routes.me.addresses, { body }),
    deleteAddress: (id: string) => c.request<void>('DELETE', routes.me.address, { params: { id } }),
    referrals: () => c.request<ReferralSummary>('GET', routes.me.referrals),
    notifications: (query: PageParams = {}) =>
      c.request<Paginated<Notification>>('GET', routes.me.notifications, { query }),
    markNotificationRead: (id: string) =>
      c.request<Notification>('POST', routes.me.notificationRead, { params: { id } }),
  },

  live: {
    sessions: (
      query: PageParams & { status?: LiveSessionStatus; type?: LiveSessionType } = {},
      o: Cache = {},
    ) => c.request<Paginated<LiveSession>>('GET', routes.live.sessions, { query, ...o }),
    session: (id: string, o: Cache = {}) =>
      c.request<LiveSession>('GET', routes.live.session, { params: { id }, ...o }),
    messages: (id: string) =>
      c.request<LiveChatMessage[]>('GET', routes.live.messages, { params: { id } }),
    postMessage: (id: string, body: { body: string; isQuestion?: boolean }) =>
      c.request<LiveChatMessage>('POST', routes.live.messages, { params: { id }, body }),
  },

  content: {
    pages: (section?: ContentSection, o: Cache = {}) =>
      c.request<ContentPage[]>('GET', routes.content.pages, { query: { section }, ...o }),
    page: (slug: string, o: Cache = {}) =>
      c.request<ContentPage>('GET', routes.content.page, { params: { slug }, ...o }),
    submitBusinessQuote: (body: QuoteRequestInput & { topic?: string }) =>
      c.request<{ id: string; status: string }>('POST', routes.content.businessQuote, {
        body,
        auth: false,
      }),
  },
});
