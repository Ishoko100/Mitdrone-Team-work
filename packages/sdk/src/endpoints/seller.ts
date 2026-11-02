import {
  routes,
  type Order,
  type OrderStatus,
  type PageParams,
  type Paginated,
  type Payout,
  type Product,
  type ProductFormValues,
  type ProductStatus,
  type ServiceListing,
  type ServiceQuote,
  type ServiceRequest,
  type UpdateOrderStatusRequest,
  type Vendor,
  type VendorAnalytics,
  type VendorBalance,
  type VendorDashboardData,
  type VendorKYC,
  type BankDetails,
  type LedgerEntry,
} from '@mitdrone/types';

import type { ApiClient } from '../client';

type OrderQuery = PageParams & { status?: OrderStatus };
type ProductQuery = PageParams & { status?: ProductStatus; kind?: string };

/** Form values use major units (₦). The API stores minor units (kobo). The mock accepts major units too. */
export const sellerEndpoints = (c: ApiClient) => {
  const p = (vendorId: string, extra: Record<string, string> = {}) => ({
    params: { vendorId, ...extra },
  });
  return {
    dashboard: (v: string) => c.request<VendorDashboardData>('GET', routes.seller.dashboard, p(v)),
    analytics: (v: string, range: VendorAnalytics['range'] = '30d') =>
      c.request<VendorAnalytics>('GET', routes.seller.analytics, { ...p(v), query: { range } }),
    settings: (v: string) => c.request<Vendor>('GET', routes.seller.settings, p(v)),
    updateSettings: (
      v: string,
      body: Partial<
        Pick<
          Vendor,
          'name' | 'description' | 'phone' | 'website' | 'city' | 'state' | 'returnPolicy'
        >
      > & { handlingDays?: number },
    ) => c.request<Vendor>('PATCH', routes.seller.settings, { ...p(v), body }),

    products: (v: string, query: ProductQuery = {}) =>
      c.request<Paginated<Product>>('GET', routes.seller.products, { ...p(v), query }),
    product: (v: string, id: string) =>
      c.request<Product>('GET', routes.seller.product, p(v, { id })),
    createProduct: (v: string, body: ProductFormValues) =>
      c.request<Product>('POST', routes.seller.products, { ...p(v), body }),
    updateProduct: (v: string, id: string, body: Partial<ProductFormValues>) =>
      c.request<Product>('PATCH', routes.seller.product, { ...p(v, { id }), body }),
    deleteProduct: (v: string, id: string) =>
      c.request<void>('DELETE', routes.seller.product, p(v, { id })),
    bulkProducts: (v: string, body: { ids: string[]; action: 'archive' | 'activate' | 'delete' }) =>
      c.request<{ affected: number }>('POST', routes.seller.productsBulk, { ...p(v), body }),

    orders: (v: string, query: OrderQuery = {}) =>
      c.request<Paginated<Order>>('GET', routes.seller.orders, { ...p(v), query }),
    order: (v: string, id: string) => c.request<Order>('GET', routes.seller.order, p(v, { id })),
    updateOrderStatus: (v: string, id: string, body: UpdateOrderStatusRequest) =>
      c.request<Order>('PATCH', routes.seller.orderStatus, { ...p(v, { id }), body }),
    bulkOrders: (v: string, body: { ids: string[]; action: 'process' | 'cancel' }) =>
      c.request<{ updated: number; failed: string[] }>('POST', routes.seller.ordersBulk, {
        ...p(v),
        body,
      }),

    inventory: (v: string, query: PageParams & { lowStock?: boolean } = {}) =>
      c.request<Paginated<Product>>('GET', routes.seller.inventory, { ...p(v), query }),
    updateStock: (v: string, productId: string, quantity: number) =>
      c.request<Product>('PATCH', routes.seller.inventoryItem, {
        ...p(v, { productId }),
        body: { quantity },
      }),

    payouts: (v: string, query: PageParams = {}) =>
      c.request<Paginated<Payout>>('GET', routes.seller.payouts, { ...p(v), query }),
    balance: (v: string) => c.request<VendorBalance>('GET', routes.seller.balance, p(v)),
    ledger: (v: string, query: PageParams = {}) =>
      c.request<Paginated<LedgerEntry>>('GET', routes.seller.ledger, { ...p(v), query }),
    updateBank: (v: string, body: BankDetails) =>
      c.request<BankDetails>('PUT', routes.seller.bank, { ...p(v), body }),

    kyc: (v: string) => c.request<VendorKYC>('GET', routes.seller.kyc, p(v)),
    saveKyc: (
      v: string,
      body: {
        legalName?: string;
        registrationNumber?: string;
        documents?: { type: string; fileName: string }[];
      },
    ) => c.request<VendorKYC>('PUT', routes.seller.kyc, { ...p(v), body }),
    submitKyc: (v: string) => c.request<VendorKYC>('POST', routes.seller.kycSubmit, p(v)),

    services: (v: string, query: PageParams = {}) =>
      c.request<Paginated<ServiceListing>>('GET', routes.seller.services, { ...p(v), query }),
    createService: (
      v: string,
      body: {
        title: string;
        description: string;
        categoryId: string;
        pricingModel: ServiceListing['pricingModel'];
        startingPriceMajor?: number;
        coverageStates: string[];
      },
    ) => c.request<ServiceListing>('POST', routes.seller.services, { ...p(v), body }),
    serviceRequests: (v: string, query: PageParams = {}) =>
      c.request<Paginated<ServiceRequest>>('GET', routes.seller.serviceRequests, {
        ...p(v),
        query,
      }),
    sendQuote: (
      v: string,
      requestId: string,
      body: { priceMajor: number; message: string; estimatedDays: number },
    ) =>
      c.request<ServiceQuote>('POST', routes.seller.serviceQuote, {
        ...p(v, { id: requestId }),
        body,
      }),
  };
};
