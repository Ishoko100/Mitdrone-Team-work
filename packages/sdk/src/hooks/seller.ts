import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../endpoints';
import { keys } from '../query-keys';

import { optimistic, patchById } from './optimistic';

import type {
  OrderStatus,
  PageParams,
  Product,
  ProductFormValues,
  ProductStatus,
  UpdateOrderStatusRequest,
  VendorAnalytics,
} from '@mitdrone/types';

/**
 * Every hook takes `vendorId` explicitly so each request is scoped to a vendor.
 * Apps pass `useAuth().user.vendorId`. The API rejects any other vendor id with 403.
 */
const on = (vendorId: string | undefined) => ({ enabled: Boolean(vendorId) });
const id = (vendorId: string | undefined) => vendorId ?? '';

export const useVendorDashboard = (v: string | undefined) =>
  useQuery({
    queryKey: keys.seller(id(v), 'dashboard'),
    queryFn: () => api.seller.dashboard(id(v)),
    ...on(v),
  });

export const useVendorAnalytics = (
  v: string | undefined,
  range: VendorAnalytics['range'] = '30d',
) =>
  useQuery({
    queryKey: keys.seller(id(v), 'analytics', range),
    queryFn: () => api.seller.analytics(id(v), range),
    placeholderData: keepPreviousData,
    ...on(v),
  });

export const useVendorSettings = (v: string | undefined) =>
  useQuery({
    queryKey: keys.seller(id(v), 'settings'),
    queryFn: () => api.seller.settings(id(v)),
    ...on(v),
  });

export const useUpdateVendorSettings = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.seller.updateSettings>[1]) =>
      api.seller.updateSettings(v, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'settings') }),
  });
};

/* ----------------------------------------------------------------- products */
export const useVendorProducts = (
  v: string | undefined,
  query: PageParams & { status?: ProductStatus; kind?: string } = {},
) =>
  useQuery({
    queryKey: keys.seller(id(v), 'products', query),
    queryFn: () => api.seller.products(id(v), query),
    placeholderData: keepPreviousData,
    ...on(v),
  });

export const useVendorProduct = (v: string | undefined, productId: string | undefined) =>
  useQuery({
    queryKey: keys.seller(id(v), 'product', productId),
    queryFn: () => api.seller.product(id(v), productId ?? ''),
    enabled: Boolean(v && productId),
  });

export const useCreateProduct = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductFormValues) => api.seller.createProduct(v, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'products') }),
  });
};

export const useUpdateProduct = (v: string, productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ProductFormValues>) => api.seller.updateProduct(v, productId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.seller(v, 'products') });
      void qc.invalidateQueries({ queryKey: keys.seller(v, 'product', productId) });
    },
  });
};

export const useDeleteProduct = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => api.seller.deleteProduct(v, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'products') }),
  });
};

export const useBulkProducts = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[]; action: 'archive' | 'activate' | 'delete' }) =>
      api.seller.bulkProducts(v, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'products') }),
  });
};

/* ------------------------------------------------------------------- orders */
export const useVendorOrders = (
  v: string | undefined,
  query: PageParams & { status?: OrderStatus } = {},
) =>
  useQuery({
    queryKey: keys.seller(id(v), 'orders', query),
    queryFn: () => api.seller.orders(id(v), query),
    placeholderData: keepPreviousData,
    ...on(v),
  });

export const useVendorOrder = (v: string | undefined, orderId: string | undefined) =>
  useQuery({
    queryKey: keys.seller(id(v), 'order', orderId),
    queryFn: () => api.seller.order(id(v), orderId ?? ''),
    enabled: Boolean(v && orderId),
  });

/**
 * Optimistic: the status changes instantly in the list AND the detail view, and rolls back if the
 * transition is rejected. Both cache families must be handled: lists live under 'orders', the
 * single-order query under 'order'.
 */
export const useUpdateOrderStatus = (v: string) => {
  const qc = useQueryClient();
  type Vars = { orderId: string } & UpdateOrderStatusRequest;
  const apply = (cached: unknown, vars: Vars) =>
    patchById<{ id: string; status: OrderStatus }>(cached, vars.orderId, (o) => ({
      ...o,
      status: vars.status,
    }));
  const lists = optimistic<Vars>(qc, keys.seller(v, 'orders'), apply);
  const detail = optimistic<Vars>(qc, keys.seller(v, 'order'), apply);
  return useMutation({
    mutationFn: ({ orderId, ...body }: Vars) => api.seller.updateOrderStatus(v, orderId, body),
    onMutate: async (vars: Vars) => ({
      lists: await lists.onMutate(vars),
      detail: await detail.onMutate(vars),
    }),
    onError: (error, vars, ctx) => {
      lists.onError(error, vars, ctx?.lists);
      detail.onError(error, vars, ctx?.detail);
    },
    onSettled: () =>
      Promise.all([
        lists.onSettled(),
        detail.onSettled(),
        qc.invalidateQueries({ queryKey: keys.seller(v, 'dashboard') }),
      ]),
  });
};

export const useBulkOrders = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[]; action: 'process' | 'cancel' }) =>
      api.seller.bulkOrders(v, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'orders') }),
  });
};

/* ---------------------------------------------------------------- inventory */
export const useVendorInventory = (
  v: string | undefined,
  query: PageParams & { lowStock?: boolean } = {},
) =>
  useQuery({
    queryKey: keys.seller(id(v), 'inventory', query),
    queryFn: () => api.seller.inventory(id(v), query),
    placeholderData: keepPreviousData,
    ...on(v),
  });

export const useUpdateStock = (v: string) => {
  const qc = useQueryClient();
  type Vars = { productId: string; quantity: number };
  const inventory = optimistic<Vars>(qc, keys.seller(v, 'inventory'), (cached, vars) =>
    patchById<Product>(cached, vars.productId, (p) => ({
      ...p,
      inventory: { ...p.inventory, quantity: vars.quantity },
    })),
  );
  return useMutation({
    mutationFn: ({ productId, quantity }: Vars) => api.seller.updateStock(v, productId, quantity),
    ...inventory,
    // Stock also shows in the products table, the product editor and the dashboard low-stock card.
    onSettled: () =>
      Promise.all([
        inventory.onSettled(),
        qc.invalidateQueries({ queryKey: keys.seller(v, 'products') }),
        qc.invalidateQueries({ queryKey: keys.seller(v, 'product') }),
        qc.invalidateQueries({ queryKey: keys.seller(v, 'dashboard') }),
      ]),
  });
};

/* -------------------------------------------------------------------- money */
export const useVendorPayouts = (v: string | undefined, query: PageParams = {}) =>
  useQuery({
    queryKey: keys.seller(id(v), 'payouts', query),
    queryFn: () => api.seller.payouts(id(v), query),
    placeholderData: keepPreviousData,
    ...on(v),
  });

export const useVendorBalance = (v: string | undefined) =>
  useQuery({
    queryKey: keys.seller(id(v), 'balance'),
    queryFn: () => api.seller.balance(id(v)),
    ...on(v),
  });

export const useVendorLedger = (v: string | undefined, query: PageParams = {}) =>
  useQuery({
    queryKey: keys.seller(id(v), 'ledger', query),
    queryFn: () => api.seller.ledger(id(v), query),
    placeholderData: keepPreviousData,
    ...on(v),
  });

export const useUpdateBank = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.seller.updateBank>[1]) =>
      api.seller.updateBank(v, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'settings') }),
  });
};

/* ---------------------------------------------------------------------- KYC */
export const useVendorKyc = (v: string | undefined) =>
  useQuery({ queryKey: keys.seller(id(v), 'kyc'), queryFn: () => api.seller.kyc(id(v)), ...on(v) });

export const useSaveKyc = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.seller.saveKyc>[1]) => api.seller.saveKyc(v, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'kyc') }),
  });
};

export const useSubmitKyc = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.seller.submitKyc(v),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.seller(v, 'kyc') });
      void qc.invalidateQueries({ queryKey: keys.seller(v, 'settings') });
    },
  });
};

/* ------------------------------------------------------------ services/quotes */
export const useVendorServices = (v: string | undefined, query: PageParams = {}) =>
  useQuery({
    queryKey: keys.seller(id(v), 'services', query),
    queryFn: () => api.seller.services(id(v), query),
    ...on(v),
  });

export const useCreateService = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof api.seller.createService>[1]) =>
      api.seller.createService(v, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'services') }),
  });
};

export const useVendorServiceRequests = (v: string | undefined, query: PageParams = {}) =>
  useQuery({
    queryKey: keys.seller(id(v), 'service-requests', query),
    queryFn: () => api.seller.serviceRequests(id(v), query),
    ...on(v),
  });

export const useSendQuote = (v: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      ...body
    }: {
      requestId: string;
      priceMajor: number;
      message: string;
      estimatedDays: number;
    }) => api.seller.sendQuote(v, requestId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.seller(v, 'service-requests') }),
  });
};
