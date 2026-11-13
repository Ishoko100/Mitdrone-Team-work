/**
 * Backend-native API DTOs derived from the live OpenAPI specification
 * (https://mitdrone.vercel.app/docs/openapi.json).
 *
 * These types describe request/response payloads as documented by the backend.
 * Response bodies that are undocumented in the spec (`{}`) are typed as `unknown`
 * or isolated unresolved types — no frontend schemas are fabricated.
 *
 * Keep these separate from frontend view models. Use explicit transformation
 * functions when a UI model differs from the backend representation.
 */

import { z } from 'zod';

/* ========================================================================
   Enums and literal unions from the backend spec
   ======================================================================== */

export const OfferMode = ['SALE', 'RENTAL'] as const;
export type OfferMode = (typeof OfferMode)[number];

export const OfferStatus = [
  'DRAFT',
  'SUBMITTED',
  'REJECTED',
  'PUBLISHED',
  'ARCHIVED',
] as const;
export type OfferStatus = (typeof OfferStatus)[number];

export const AssetStatus = [
  'AVAILABLE',
  'MAINTENANCE',
  'LOST',
  'RETIRED',
  'SOLD',
] as const;
export type AssetStatus = (typeof AssetStatus)[number];

export const StockKind = ['QUANTITY', 'SERIALIZED'] as const;
export type StockKind = (typeof StockKind)[number];

export const MembershipRole = [
  'CATALOG',
  'FULFILMENT',
  'COORDINATOR',
  'FINANCE',
] as const;
export type MembershipRole = (typeof MembershipRole)[number];

export const ApplicationDecision = [
  'APPROVE',
  'REJECT',
  'REQUEST_MORE_INFORMATION',
] as const;
export type ApplicationDecision = (typeof ApplicationDecision)[number];

export const ReviewDecision = ['APPROVE', 'REJECT'] as const;
export type ReviewDecision = (typeof ReviewDecision)[number];

export const RentalRounding = ['STARTED_UNIT', 'WHOLE_UNITS_ONLY'] as const;
export type RentalRounding = (typeof RentalRounding)[number] | null;

export const TaxRounding = ['HALF_UP', 'UP', 'DOWN'] as const;
export type TaxRounding = (typeof TaxRounding)[number];

export const BusinessType = [
  'INDIVIDUAL_SELLER',
  'REGISTERED_COMPANY',
  'DISTRIBUTOR',
  'MANUFACTURER',
] as const;
export type BusinessType = (typeof BusinessType)[number];

export const ProviderType = ['INDIVIDUAL', 'COMPANY'] as const;
export type ProviderType = (typeof ProviderType)[number];

export const Capability = ['SALES', 'RENTALS', 'TRAINING'] as const;
export type Capability = (typeof Capability)[number];

/* ========================================================================
   Pagination (backend uses `page` and `limit`, not `page`/`pageSize`)
   ======================================================================== */

export interface BackendPageParams {
  page?: number;
  limit?: number;
}

export interface BackendPaginatedResponse<T> {
  // Response body shape is undocumented (`{}` in spec). Cast at the call site.
  data: T;
}

/* ========================================================================
   Auth DTOs
   ======================================================================== */

export const RegisterDtoSchema = z.object({
  email: z.string().email().max(254),
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: 'Accepted terms must be true',
  }),
  termsVersion: z.string(),
  fullName: z.string(),
  phone: z.string(),
  confirmPassword: z.string().max(128),
  password: z.string().max(128),
  displayName: z.string().optional(),
});
export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

export const RegistrationTermsResponseSchema = z.object({
  buyer: z.string(),
  vendor: z.string(),
  serviceProvider: z.string(),
});
export type RegistrationTermsResponse = z.infer<
  typeof RegistrationTermsResponseSchema
>;

export const LoginDtoSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().max(128),
});
export type LoginDto = z.infer<typeof LoginDtoSchema>;

export const VerifyEmailDtoSchema = z.object({
  token: z.string().length(43),
  password: z.string().max(128),
});
export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>;

export const EmailDtoSchema = z.object({
  email: z.string().email().max(254),
});
export type EmailDto = z.infer<typeof EmailDtoSchema>;

export const ResetPasswordDtoSchema = z.object({
  token: z.string().length(43),
  password: z.string().max(128),
});
export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>;

export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string().max(128),
  newPassword: z.string().min(15).max(128),
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

/* ========================================================================
   Organization DTOs
   ======================================================================== */

export const ApplicationDtoSchema = z.object({
  acceptedTerms: z.boolean().refine((v) => v === true),
  termsVersion: z.string(),
  name: z.string(),
  businessEmail: z.string().email().max(254),
  phone: z.string(),
  ownerFullName: z.string(),
  businessAddress: z.string(),
  location: z.string(),
  businessType: z.enum(BusinessType),
  businessRegistrationDetails: z.string(),
  productCategories: z.array(z.string()),
  description: z.string(),
  capabilities: z.array(z.enum(Capability)),
});
export type ApplicationDto = z.infer<typeof ApplicationDtoSchema>;

export const ServiceProviderApplicationDtoSchema = z.object({
  acceptedTerms: z.boolean().refine((v) => v === true),
  termsVersion: z.string(),
  name: z.string(),
  businessEmail: z.string().email().max(254),
  phone: z.string(),
  location: z.string(),
  serviceCoverage: z.string(),
  providerType: z.enum(ProviderType),
  serviceCategories: z.array(z.string()),
  experience: z.string(),
  equipmentAndCapabilities: z.string(),
  certificationsOrLicences: z.string(),
  portfolio: z.string(),
});
export type ServiceProviderApplicationDto = z.infer<
  typeof ServiceProviderApplicationDtoSchema
>;

export const ResubmitApplicationDtoSchema = ApplicationDtoSchema.extend({
  expectedVersion: z.number().int().min(1).max(2147483647),
});
export type ResubmitApplicationDto = z.infer<typeof ResubmitApplicationDtoSchema>;

export const ResubmitServiceProviderApplicationDtoSchema =
  ServiceProviderApplicationDtoSchema.extend({
    expectedVersion: z.number().int().min(1).max(2147483647),
  });
export type ResubmitServiceProviderApplicationDto = z.infer<
  typeof ResubmitServiceProviderApplicationDtoSchema
>;

export const MemberDtoSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(MembershipRole),
});
export type MemberDto = z.infer<typeof MemberDtoSchema>;

export const ApplicationReviewDtoSchema = z.object({
  expectedVersion: z.number().int().min(1).max(2147483647),
  reason: z.string(),
  decision: z.enum(ApplicationDecision),
});
export type ApplicationReviewDto = z.infer<typeof ApplicationReviewDtoSchema>;

export const ReasonDtoSchema = z.object({
  expectedVersion: z.number().int().min(1).max(2147483647),
  reason: z.string(),
});
export type ReasonDto = z.infer<typeof ReasonDtoSchema>;

/* Organization (response body undocumented — `{}` in spec) */
export interface Organization {
  /** Backend response schema not documented. Cast from `unknown` at the call site. */
  [key: string]: unknown;
}

/* ========================================================================
   Offer DTOs
   ======================================================================== */

export const CreateOfferDtoSchema = z.object({
  productId: z.string().uuid(),
  mode: z.enum(OfferMode),
  amountMinor: z.string().nullable().optional(),
  currency: z.object({}).default({}), // schema: { default: "NGN", pattern: "^[A-Z]{3}$" }
  rateUnit: z.string(),
});
export type CreateOfferDto = z.infer<typeof CreateOfferDtoSchema>;

export const UpdateOfferDtoSchema = z.object({
  productId: z.string().uuid(),
  mode: z.enum(OfferMode),
  amountMinor: z.string().nullable().optional(),
  currency: z.object({}).default({}),
  rateUnit: z.string(),
  expectedVersion: z.number().int().min(1).max(2147483647),
});
export type UpdateOfferDto = z.infer<typeof UpdateOfferDtoSchema>;

export const VersionDtoSchema = z.object({
  expectedVersion: z.number().int().min(1).max(2147483647),
});
export type VersionDto = z.infer<typeof VersionDtoSchema>;

export const CreateProductDtoSchema = z.object({
  name: z.string(),
});
export type CreateProductDto = z.infer<typeof CreateProductDtoSchema>;

export const ReviewDtoSchema = z.object({
  expectedVersion: z.number().int().min(1).max(2147483647),
  reason: z.string(),
  decision: z.enum(ReviewDecision),
});
export type ReviewDto = z.infer<typeof ReviewDtoSchema>;

/* Offer (response body undocumented — `{}` in spec) */
export interface Offer {
  [key: string]: unknown;
}

/* ========================================================================
   Inventory DTOs
   ======================================================================== */

export const CreateStockDtoSchema = z.object({
  kind: z.enum(StockKind),
  initialOnHand: z.number().int().min(0).max(1000000).default(0),
});
export type CreateStockDto = z.infer<typeof CreateStockDtoSchema>;

export const AdjustStockDtoSchema = z.object({
  expectedVersion: z.number().int().min(1).max(2147483647),
  delta: z.number().int().min(-1000000).max(1000000),
  reason: z.string(),
});
export type AdjustStockDto = z.infer<typeof AdjustStockDtoSchema>;

export const RentalTermsDtoSchema = z.object({
  preparationMinutes: z.number().min(0).max(10080),
  returnBufferMinutes: z.number().min(0).max(10080),
  minimumDurationMinutes: z.number().min(1).max(525600),
  maximumDurationMinutes: z.number().min(1).max(525600),
  expectedVersion: z.number().min(1).max(2147483647),
});
export type RentalTermsDto = z.infer<typeof RentalTermsDtoSchema>;

export const CreateAssetDtoSchema = z.object({
  productId: z.string().uuid(),
  serialNumber: z.string(),
  conditionNote: z.string(),
  saleOfferId: z.string().uuid().optional(),
  rentalOfferId: z.string().uuid().optional(),
});
export type CreateAssetDto = z.infer<typeof CreateAssetDtoSchema>;

export const UpdateAssetDtoSchema = z.object({
  expectedVersion: z.number().min(1).max(2147483647),
  status: z.enum(AssetStatus),
  conditionNote: z.string(),
  reason: z.string(),
});
export type UpdateAssetDto = z.infer<typeof UpdateAssetDtoSchema>;

export const BlockAssetDtoSchema = z.object({
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  reason: z.string(),
});
export type BlockAssetDto = z.infer<typeof BlockAssetDtoSchema>;

/* Stock, RentalTerms, Asset (response bodies undocumented — `{}` in spec) */
export interface Stock {
  [key: string]: unknown;
}
export interface RentalTerms {
  [key: string]: unknown;
}
export interface Asset {
  [key: string]: unknown;
}

/* ========================================================================
   Availability
   ======================================================================== */

/* Availability response body undocumented — `{}` in spec */
export interface Availability {
  [key: string]: unknown;
}

/* ========================================================================
   Reservation DTOs
   ======================================================================== */

export const CreateHoldDtoSchema = z.object({
  offerId: z.string().uuid(),
  expectedOfferVersion: z.number().min(1).max(2147483647),
  quantity: z.number().int().min(1).max(100).default(1),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  expectedTermsVersion: z.number().min(1).max(2147483647).optional(),
});
export type CreateHoldDto = z.infer<typeof CreateHoldDtoSchema>;

/* Reservation (response body undocumented — `{}` in spec) */
export interface Reservation {
  [key: string]: unknown;
}

/* ========================================================================
   Checkout DTOs
   ======================================================================== */

export const CheckoutTermsDtoSchema = z.object({
  enabled: z.boolean(),
  expectedOfferVersion: z.number(),
  expectedVersion: z.number(),
  rentalRounding: z.enum(RentalRounding).nullable().optional(),
  taxBasisPoints: z.number().min(0).max(10000),
  taxRounding: z.enum(TaxRounding),
  deliveryFeeMinor: z.string(),
  depositMinor: z.string(),
  approvalReference: z.string(),
});
export type CheckoutTermsDto = z.infer<typeof CheckoutTermsDtoSchema>;

export const CreateOrderDtoSchema = z.object({
  reservationId: z.string().uuid(),
  expectedCheckoutTermsVersion: z.number(),
  expectedTotalMinor: z.string(),
  currency: z.string(),
});
export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;

/* CheckoutTerms, Order (response bodies undocumented — `{}` in spec) */
export interface CheckoutTerms {
  [key: string]: unknown;
}
export interface BackendOrder {
  [key: string]: unknown;
}

/* ========================================================================
   Health
   ======================================================================== */

export const HealthLiveResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
});
export type HealthLiveResponse = z.infer<typeof HealthLiveResponseSchema>;

/* Health ready returns 200 when ready, 503 when unavailable. Body shape varies. */

/* ========================================================================
   Amount in minor currency units
   ======================================================================== */

/**
 * Amount expressed in minor currency units (kobo for NGN, cents for USD).
 * The backend represents these as strings in DTOs to preserve precision.
 */
export type AmountMinor = string;

/* ========================================================================
   Optimistic concurrency
   ======================================================================== */

/**
 * Backend optimistic concurrency token. Sent on mutations that modify
 * versioned resources (offers, assets, stock adjustments, applications).
 */
export type ExpectedVersion = number;

/* ========================================================================
   Idempotency
   ======================================================================== */

/**
 * Canonical idempotency key header name. The backend spec lists both
 * `idempotency-key` and `Idempotency-Key`; the canonical form is used.
 * See docs/backend-integration-matrix.md for the discrepancy.
 */
export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

/**
 * Generate a UUID v4 idempotency key for a new reservation or order intent.
 * Reuse the same key when retrying the same logical operation; generate a
 * new key for a genuinely new user intent.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
