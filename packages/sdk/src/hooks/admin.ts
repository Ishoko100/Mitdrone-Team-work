import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../endpoints';
import { keys } from '../query-keys';

import type {
  AuditAction,
  AuditEntityType,
  DisputeStatus,
  OrderStatus,
  PageParams,
  PayoutStatus,
  PlatformSettings,
  ProductFilters,
  Role,
  VendorStatus,
} from '@mitdrone/types';

/** Every admin mutation invalidates the whole admin namespace so the audit log and counts stay fresh. */
function useAdminMutation<TVars, TData>(fn: (vars: TVars) => Promise<TData>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.admin() }),
  });
}

export const useAdminDashboard = () =>
  useQuery({ queryKey: keys.admin('dashboard'), queryFn: () => api.admin.dashboard() });

export const useAdminVendors = (
  query: PageParams & { status?: VendorStatus; type?: string } = {},
) =>
  useQuery({
    queryKey: keys.admin('vendors', query),
    queryFn: () => api.admin.vendors(query),
    placeholderData: keepPreviousData,
  });
export const useAdminVendor = (id: string | undefined) =>
  useQuery({
    queryKey: keys.admin('vendor', id),
    queryFn: () => api.admin.vendor(id ?? ''),
    enabled: Boolean(id),
  });
export const useApproveVendor = () => useAdminMutation((id: string) => api.admin.approveVendor(id));
export const useRejectVendor = () =>
  useAdminMutation(({ id, reason }: { id: string; reason: string }) =>
    api.admin.rejectVendor(id, reason),
  );
export const useSuspendVendor = () =>
  useAdminMutation(({ id, reason }: { id: string; reason: string }) =>
    api.admin.suspendVendor(id, reason),
  );

export const useAdminProducts = (query: ProductFilters & PageParams = {}) =>
  useQuery({
    queryKey: keys.admin('products', query),
    queryFn: () => api.admin.products(query),
    placeholderData: keepPreviousData,
  });
export const useApproveProduct = () =>
  useAdminMutation((id: string) => api.admin.approveProduct(id));
export const useFlagProduct = () =>
  useAdminMutation(({ id, reason }: { id: string; reason: string }) =>
    api.admin.flagProduct(id, reason),
  );
export const useDeleteProductAdmin = () =>
  useAdminMutation((id: string) => api.admin.deleteProduct(id));

export const useAdminOrders = (query: PageParams & { status?: OrderStatus } = {}) =>
  useQuery({
    queryKey: keys.admin('orders', query),
    queryFn: () => api.admin.orders(query),
    placeholderData: keepPreviousData,
  });
export const useAdminOrder = (id: string | undefined) =>
  useQuery({
    queryKey: keys.admin('order', id),
    queryFn: () => api.admin.order(id ?? ''),
    enabled: Boolean(id),
  });
export const useRefundOrder = () =>
  useAdminMutation(({ id, reason }: { id: string; reason: string }) =>
    api.admin.refundOrder(id, reason),
  );

export const useAdminDisputes = (query: PageParams & { status?: DisputeStatus } = {}) =>
  useQuery({
    queryKey: keys.admin('disputes', query),
    queryFn: () => api.admin.disputes(query),
    placeholderData: keepPreviousData,
  });
export const useAdminDispute = (id: string | undefined) =>
  useQuery({
    queryKey: keys.admin('dispute', id),
    queryFn: () => api.admin.dispute(id ?? ''),
    enabled: Boolean(id),
  });
export const useAssignDispute = () => useAdminMutation((id: string) => api.admin.assignDispute(id));
export const useMessageDispute = () =>
  useAdminMutation(({ id, body }: { id: string; body: string }) =>
    api.admin.messageDispute(id, body),
  );
export const useResolveDispute = () =>
  useAdminMutation(
    ({ id, ...body }: { id: string; outcome: 'refund' | 'no_refund'; resolution: string }) =>
      api.admin.resolveDispute(id, body),
  );

export const useAdminPayouts = (
  query: PageParams & { status?: PayoutStatus; vendorId?: string } = {},
) =>
  useQuery({
    queryKey: keys.admin('payouts', query),
    queryFn: () => api.admin.payouts(query),
    placeholderData: keepPreviousData,
  });
export const useProcessPayout = () => useAdminMutation((id: string) => api.admin.processPayout(id));
export const useHoldPayout = () =>
  useAdminMutation(({ id, reason }: { id: string; reason?: string }) =>
    api.admin.holdPayout(id, reason),
  );

export const useAdminUsers = (query: PageParams & { role?: Role; status?: string } = {}) =>
  useQuery({
    queryKey: keys.admin('users', query),
    queryFn: () => api.admin.users(query),
    placeholderData: keepPreviousData,
  });
export const useCreateUser = () =>
  useAdminMutation((body: Parameters<typeof api.admin.createUser>[0]) =>
    api.admin.createUser(body),
  );
export const useUpdateUser = () =>
  useAdminMutation(
    ({ id, ...body }: { id: string; role?: Role; status?: 'active' | 'suspended' }) =>
      api.admin.updateUser(id, body),
  );

export const useAdminSettings = () =>
  useQuery({ queryKey: keys.admin('settings'), queryFn: () => api.admin.settings() });
export const useUpdateSettings = () =>
  useAdminMutation((body: Partial<Omit<PlatformSettings, 'updatedAt' | 'updatedBy'>>) =>
    api.admin.updateSettings(body),
  );

export const useAuditLogs = (
  query: PageParams & { action?: AuditAction; entityType?: AuditEntityType; actorId?: string } = {},
) =>
  useQuery({
    queryKey: keys.admin('audit-logs', query),
    queryFn: () => api.admin.auditLogs(query),
    placeholderData: keepPreviousData,
  });

/** Call after generating a CSV/PDF so the export lands in the audit log. */
export const useRecordExport = () =>
  useAdminMutation((body: { entity: string; format: 'csv' | 'pdf'; rowCount: number }) =>
    api.admin.recordExport(body),
  );
