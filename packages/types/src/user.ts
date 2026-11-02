import type { Address, ID, ISODateString, Timestamps } from './common';

export const ROLES = [
  'customer',
  'vendor_owner',
  'vendor_staff',
  'admin',
  'super_admin',
  'support',
] as const;
export type Role = (typeof ROLES)[number];

export const VENDOR_ROLES: readonly Role[] = ['vendor_owner', 'vendor_staff'];
export const ADMIN_ROLES: readonly Role[] = ['admin', 'super_admin', 'support'];

export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User extends Timestamps {
  id: ID;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  status: UserStatus;
  /** Set for vendor_owner and vendor_staff. All vendor API calls are scoped by this. */
  vendorId?: ID;
  emailVerified: boolean;
  lastLoginAt?: ISODateString;
}

export interface Customer extends User {
  role: 'customer';
  addresses: Address[];
  referralCode: string;
  referredBy?: ID;
}

export interface VendorMember extends User {
  role: 'vendor_owner' | 'vendor_staff';
  vendorId: ID;
}

export interface Admin extends User {
  role: 'admin' | 'super_admin' | 'support';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires. */
  expiresIn: number;
}

export interface Session {
  user: User;
  tokens: AuthTokens;
}
