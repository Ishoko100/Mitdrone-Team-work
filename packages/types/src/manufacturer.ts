import type { ID, Timestamps } from './common';

export interface Manufacturer extends Timestamps {
  id: ID;
  slug: string;
  name: string;
  logoUrl?: string;
  description: string;
  country: string;
  isNigerian: boolean;
  capabilities: string[];
  industriesServed: string[];
  verified: boolean;
  email: string;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  productCount: number;
  /** Linked vendor account, when the manufacturer sells on Mitdrone. */
  vendorId?: ID;
}
