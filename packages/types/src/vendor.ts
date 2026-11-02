import type { ID, ISODateString, Money, Timestamps } from './common';

export type VendorType =
  'individual_seller' | 'dealer' | 'manufacturer' | 'service_provider' | 'renter';

export type VendorStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended';
export type KYCStatus = 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'rejected';

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

export interface ShippingPolicy {
  handlingDays: number;
  flatRate?: Money;
  freeShippingThreshold?: Money;
  regions: string[];
}

export interface Vendor extends Timestamps {
  id: ID;
  slug: string;
  name: string;
  type: VendorType;
  status: VendorStatus;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  email: string;
  phone?: string;
  website?: string;
  city: string;
  state: string;
  country: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  productCount: number;
  /** 0..1, platform commission for this vendor. */
  commissionRate: number;
  ownerId: ID;
  shipping: ShippingPolicy;
  returnPolicy: string;
  bank?: BankDetails;
  kycStatus: KYCStatus;
}

export type KYCDocumentType =
  'cac_certificate' | 'government_id' | 'proof_of_address' | 'ncaa_permit' | 'tax_id';

export interface KYCDocument {
  type: KYCDocumentType;
  fileName: string;
  url: string;
  uploadedAt: ISODateString;
}

export interface VendorKYC extends Timestamps {
  id: ID;
  vendorId: ID;
  status: KYCStatus;
  legalName: string;
  registrationNumber?: string;
  documents: KYCDocument[];
  reviewedBy?: ID;
  reviewedAt?: ISODateString;
  rejectionReason?: string;
}

export interface VendorStats {
  revenue: Money;
  orders: number;
  products: number;
  conversionRate: number;
  pendingPayout: Money;
}

/** Lightweight vendor embed returned inside product responses. */
export interface VendorSummary {
  id: ID;
  slug: string;
  name: string;
  type: VendorType;
  verified: boolean;
  rating: number;
  city: string;
  state: string;
}
