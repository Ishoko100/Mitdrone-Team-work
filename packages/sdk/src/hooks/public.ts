import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api, type ProductQuery } from '../endpoints';
import { keys } from '../query-keys';

import { optimistic, patchById, removeById } from './optimistic';

import type {
  Address,
  AddressInput,
  CartQuoteRequest,
  ConfirmCheckoutRequest,
  ContentSection,
  CreatePaymentIntentRequest,
  LiveChatMessage,
  LiveSessionStatus,
  LiveSessionType,
  Notification,
  PageParams,
  QuoteRequestInput,
  ServiceRequestInput,
} from '@mitdrone/types';

interface Opts {
  enabled?: boolean;
}

/* ------------------------------------------------------------------ catalog */
export const useProducts = (query: ProductQuery = {}, o: Opts = {}) =>
  useQuery({
    queryKey: keys.catalog('products', query),
    queryFn: ({ signal }) => api.catalog.products(query, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    ...o,
  });

export const useInfiniteProducts = (query: Omit<ProductQuery, 'page'> = {}) =>
  useInfiniteQuery({
    queryKey: keys.catalog('products', 'infinite', query),
    queryFn: ({ pageParam, signal }) =>
      api.catalog.products({ ...query, page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

export const useProduct = (idOrSlug: string | undefined, o: Opts = {}) =>
  useQuery({
    queryKey: keys.catalog('product', idOrSlug),
    queryFn: () => api.catalog.product(idOrSlug ?? ''),
    enabled: Boolean(idOrSlug) && (o.enabled ?? true),
  });

export const useProductReviews = (productId: string | undefined, query: PageParams = {}) =>
  useQuery({
    queryKey: keys.catalog('reviews', productId, query),
    queryFn: () => api.catalog.reviews(productId ?? '', query),
    enabled: Boolean(productId),
    placeholderData: keepPreviousData,
  });

export const useCreateReview = (productId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { rating: number; title: string; body: string }) =>
      api.catalog.createReview(productId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.catalog() }),
  });
};

export const useCategories = (group?: 'drones' | 'industry' | 'accessories' | 'equipment') =>
  useQuery({
    queryKey: keys.catalog('categories', group),
    queryFn: () => api.catalog.categories(group ? { group } : {}),
    staleTime: 10 * 60_000,
  });

export const useVendors = (query: PageParams & { type?: string; state?: string } = {}) =>
  useQuery({
    queryKey: keys.catalog('vendors', query),
    queryFn: () => api.catalog.vendors(query),
    placeholderData: keepPreviousData,
  });

export const useVendor = (slug: string | undefined) =>
  useQuery({
    queryKey: keys.catalog('vendor', slug),
    queryFn: () => api.catalog.vendor(slug ?? ''),
    enabled: Boolean(slug),
  });

export const useManufacturers = (query: PageParams & { nigerian?: boolean } = {}) =>
  useQuery({
    queryKey: keys.catalog('manufacturers', query),
    queryFn: () => api.catalog.manufacturers(query),
    placeholderData: keepPreviousData,
  });

export const useManufacturer = (slug: string | undefined) =>
  useQuery({
    queryKey: keys.catalog('manufacturer', slug),
    queryFn: () => api.catalog.manufacturer(slug ?? ''),
    enabled: Boolean(slug),
  });

export const useSearch = (q: string) =>
  useQuery({
    queryKey: keys.catalog('search', q),
    queryFn: ({ signal }) => api.catalog.search(q, { signal }),
    enabled: q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });

/* ----------------------------------------------------------------- services */
export const useServiceCategories = () =>
  useQuery({
    queryKey: keys.services('categories'),
    queryFn: () => api.services.categories(),
    staleTime: 10 * 60_000,
  });

export const useServices = (
  query: PageParams & { category?: string; state?: string; vendor?: string } = {},
) =>
  useQuery({
    queryKey: keys.services('list', query),
    queryFn: () => api.services.list(query),
    placeholderData: keepPreviousData,
  });

export const useService = (slug: string | undefined) =>
  useQuery({
    queryKey: keys.services('detail', slug),
    queryFn: () => api.services.detail(slug ?? ''),
    enabled: Boolean(slug),
  });

export const useCreateServiceRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ServiceRequestInput) => api.services.createRequest(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.services('requests') }),
  });
};

export const useMyServiceRequests = (query: PageParams = {}, o: Opts = {}) =>
  useQuery({
    queryKey: keys.services('requests', query),
    queryFn: () => api.services.myRequests(query),
    ...o,
  });

export const useRequestQuotes = (requestId: string | undefined) =>
  useQuery({
    queryKey: keys.services('requests', requestId, 'quotes'),
    queryFn: () => api.services.quotes(requestId ?? ''),
    enabled: Boolean(requestId),
  });

/* ----------------------------------------------------------------- checkout */
export const useCartQuote = (request: CartQuoteRequest, o: Opts = {}) =>
  useQuery({
    queryKey: keys.me('cart-quote', request),
    queryFn: () => api.checkout.quote(request),
    enabled: request.items.length > 0 && (o.enabled ?? true),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });

export const useCreatePaymentIntent = () =>
  useMutation({
    mutationFn: (body: CreatePaymentIntentRequest) => api.checkout.createPaymentIntent(body),
  });

export const useConfirmCheckout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConfirmCheckoutRequest) => api.checkout.confirm(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.me('orders') });
      void qc.invalidateQueries({ queryKey: keys.catalog('products') });
    },
  });
};

/* ------------------------------------------------------------------ account */
export const useMyOrders = (query: PageParams & { status?: string } = {}, o: Opts = {}) =>
  useQuery({
    queryKey: keys.me('orders', query),
    queryFn: () => api.me.orders(query),
    placeholderData: keepPreviousData,
    ...o,
  });

export const useMyOrder = (id: string | undefined) =>
  useQuery({
    queryKey: keys.me('order', id),
    queryFn: () => api.me.order(id ?? ''),
    enabled: Boolean(id),
  });

export const useAddresses = (o: Opts = {}) =>
  useQuery({ queryKey: keys.me('addresses'), queryFn: () => api.me.addresses(), ...o });

export const useAddAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddressInput & { isDefault?: boolean; label?: string }) =>
      api.me.addAddress(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.me('addresses') }),
  });
};

export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.me.deleteAddress(id),
    ...optimistic<string>(
      qc,
      keys.me('addresses'),
      (cached, id) => removeById(cached, id) as Address[],
    ),
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; phone?: string }) => api.me.updateProfile(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.me() }),
  });
};

export const useReferrals = (o: Opts = {}) =>
  useQuery({ queryKey: keys.me('referrals'), queryFn: () => api.me.referrals(), ...o });

export const useNotifications = (query: PageParams = {}, o: Opts = {}) =>
  useQuery({
    queryKey: keys.me('notifications', query),
    queryFn: () => api.me.notifications(query),
    ...o,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.me.markNotificationRead(id),
    ...optimistic<string>(qc, keys.me('notifications'), (cached, id) =>
      patchById<Notification>(cached, id, (n) => ({ ...n, read: true })),
    ),
  });
};

/* --------------------------------------------------------------------- live */
export const useLiveSessions = (
  query: PageParams & { status?: LiveSessionStatus; type?: LiveSessionType } = {},
) =>
  useQuery({
    queryKey: keys.live('sessions', query),
    queryFn: () => api.live.sessions(query),
    placeholderData: keepPreviousData,
  });

export const useLiveSession = (id: string | undefined) =>
  useQuery({
    queryKey: keys.live('session', id),
    queryFn: () => api.live.session(id ?? ''),
    enabled: Boolean(id),
  });

/** Polls so the mock chat feels live. */
export const useLiveMessages = (id: string | undefined, pollMs = 4000) =>
  useQuery({
    queryKey: keys.live('messages', id),
    queryFn: () => api.live.messages(id ?? ''),
    enabled: Boolean(id),
    refetchInterval: pollMs,
  });

export const usePostLiveMessage = (sessionId: string, authorName: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { body: string; isQuestion?: boolean }) =>
      api.live.postMessage(sessionId, body),
    ...optimistic<{ body: string; isQuestion?: boolean }>(
      qc,
      keys.live('messages', sessionId),
      (cached, vars) => {
        const pending: LiveChatMessage = {
          id: `pending_${Date.now()}`,
          sessionId,
          authorName,
          body: vars.body,
          isQuestion: vars.isQuestion ?? vars.body.includes('?'),
          createdAt: new Date().toISOString(),
        };
        return Array.isArray(cached) ? [...cached, pending] : cached;
      },
    ),
  });
};

/* ------------------------------------------------------------------ content */
export const useContentPages = (section?: ContentSection) =>
  useQuery({
    queryKey: keys.content('pages', section),
    queryFn: () => api.content.pages(section),
    staleTime: 10 * 60_000,
  });

export const useContentPage = (slug: string | undefined) =>
  useQuery({
    queryKey: keys.content('page', slug),
    queryFn: () => api.content.page(slug ?? ''),
    enabled: Boolean(slug),
  });

export const useSubmitBusinessQuote = () =>
  useMutation({
    mutationFn: (body: QuoteRequestInput & { topic?: string }) =>
      api.content.submitBusinessQuote(body),
  });
