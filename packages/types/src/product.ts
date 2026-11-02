import type { ID, Money, Timestamps } from './common';
import type { VendorSummary } from './vendor';

export type ListingType = 'sale' | 'rent';
export type ProductCondition = 'new' | 'used' | 'refurbished';
export type ProductStatus = 'draft' | 'pending_review' | 'active' | 'flagged' | 'archived';
export type ProductKind = 'drone' | 'accessory' | 'spare_part' | 'payload' | 'equipment';

export interface Category {
  id: ID;
  slug: string;
  name: string;
  parentId?: ID;
  group: 'drones' | 'industry' | 'accessories' | 'equipment';
  description?: string;
  imageUrl?: string;
  productCount: number;
}

export interface Inventory {
  sku: string;
  quantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
}

export interface Variant {
  id: ID;
  name: string;
  options: Record<string, string>;
  price: Money;
  inventory: Inventory;
  imageUrl?: string;
}

export interface RentalPricing {
  daily: Money;
  weekly?: Money;
  monthly?: Money;
  deposit: Money;
  minDays: number;
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product extends Timestamps {
  id: ID;
  slug: string;
  title: string;
  /** Sanitized HTML from the rich text editor. */
  description: string;
  shortDescription: string;
  kind: ProductKind;
  listingType: ListingType;
  condition: ProductCondition;
  status: ProductStatus;
  vendorId: ID;
  manufacturerId?: ID;
  brand: string;
  categoryIds: ID[];
  images: ProductImage[];
  price: Money;
  compareAtPrice?: Money;
  rental?: RentalPricing;
  variants: Variant[];
  inventory: Inventory;
  specs: Record<string, string>;
  tags: string[];
  rating: number;
  reviewCount: number;
  salesCount: number;
  featured: boolean;
  dealEndsAt?: string;
  moderationNote?: string;
  /** Embedded by the API on public/admin responses so cards need no extra request. */
  vendor?: VendorSummary;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  vendor?: string;
  kind?: ProductKind;
  listingType?: ListingType;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  onSale?: boolean;
  status?: ProductStatus;
  featured?: boolean;
  /** Only products with an active discount (dealEndsAt in the future). */
  deal?: boolean;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
