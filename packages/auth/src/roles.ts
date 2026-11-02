import { ADMIN_ROLES, VENDOR_ROLES, type Role } from '@mitdrone/types';

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Customer',
  vendor_owner: 'Vendor owner',
  vendor_staff: 'Vendor staff',
  admin: 'Admin',
  super_admin: 'Super admin',
  support: 'Support',
};

export const isVendorRole = (role: Role | undefined): boolean =>
  !!role && VENDOR_ROLES.includes(role);
export const isAdminRole = (role: Role | undefined): boolean =>
  !!role && ADMIN_ROLES.includes(role);

export type Permission =
  | 'vendor.bank.edit'
  | 'vendor.settings.edit'
  | 'admin.read'
  | 'admin.write'
  | 'admin.disputes.handle'
  | 'admin.settings.edit'
  | 'admin.roles.edit';

/** Mirrors the checks the mock API enforces. The backend remains the source of truth. */
const PERMISSIONS: Record<Permission, readonly Role[]> = {
  'vendor.bank.edit': ['vendor_owner'],
  'vendor.settings.edit': ['vendor_owner'],
  'admin.read': ['admin', 'super_admin', 'support'],
  'admin.write': ['admin', 'super_admin'],
  'admin.disputes.handle': ['admin', 'super_admin', 'support'],
  'admin.settings.edit': ['super_admin'],
  'admin.roles.edit': ['super_admin'],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && PERMISSIONS[permission].includes(role);
}

/** Only same-site relative paths. Prevents open redirects through ?next=. */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\'))
    return fallback;
  return next;
}
