import type { ID, Money, Timestamps } from './common';
import type { VendorSummary } from './vendor';

export type ServiceGroup = 'drone_services' | 'professional' | 'support';

export interface ServiceCategory {
  id: ID;
  slug: string;
  name: string;
  group: ServiceGroup;
  description: string;
  icon?: string;
}

export type PricingModel = 'per_hectare' | 'per_hour' | 'per_project' | 'quote';

/** Separate from Product so Services can become its own marketplace. */
export interface ServiceListing extends Timestamps {
  id: ID;
  slug: string;
  title: string;
  description: string;
  categoryId: ID;
  vendorId: ID;
  pricingModel: PricingModel;
  startingPrice?: Money;
  coverageStates: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  status: 'active' | 'paused' | 'pending_review';
  vendor?: VendorSummary;
}

export type ServiceRequestStatus = 'open' | 'quoted' | 'awarded' | 'closed';

/** "Post a project", e.g. Ibrahim wants his farm mapped. */
export interface ServiceRequest extends Timestamps {
  id: ID;
  customerId: ID;
  categoryId: ID;
  title: string;
  description: string;
  state: string;
  city?: string;
  areaHectares?: number;
  budget?: Money;
  neededBy?: string;
  status: ServiceRequestStatus;
  quoteCount: number;
}

export interface ServiceQuote extends Timestamps {
  id: ID;
  requestId: ID;
  vendorId: ID;
  price: Money;
  message: string;
  estimatedDays: number;
  status: 'sent' | 'accepted' | 'declined';
  vendor?: VendorSummary;
}
