# MITDrone Backend Integration Matrix

Maps the live backend OpenAPI specification (`https://mitdrone.vercel.app/docs/openapi.json`)
against the existing frontend SDK (`packages/sdk/src/endpoints/`). This is a read-only
audit document — no code changes are made here.

Base path: `/api/v1` for all backend paths except health (`/health/*`).
Security scheme: `mitdrone_session` HTTP-only cookie. Authenticated mutations require `x-csrf-token`.

Classification legend:
- **Supported** — frontend SDK method exists with matching path/method.
- **Partially supported** — path/method exists but request or response shape differs.
- **Missing from frontend** — backend endpoint exists; no frontend SDK method.
- **Missing from backend specification** — frontend SDK method exists; backend has no matching path.
- **Requires backend confirmation** — response schema, CSRF source, or behaviour is undocumented.

---

## Authentication

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| A1 | `GET /auth/registration-terms` | `publicEndpoints().auth.registrationTerms()` | Supported | Matches. Response schema is `{}` in spec — body type unverified. |
| A2 | `POST /auth/register` | `publicEndpoints().auth.register()` | Supported | Matches. `RegisterDto` schema documented. Returns 202. |
| A3 | `POST /auth/verify-email` | `publicEndpoints().auth.verifyEmail()` | Supported | Matches. `VerifyEmailDto` (token 43 chars, password). Returns 204. |
| A4 | `POST /auth/resend-verification` | `publicEndpoints().auth.resendVerification()` | Supported | Matches. `EmailDto`. Returns 202. |
| A5 | `POST /auth/forgot-password` | `publicEndpoints().auth.forgotPassword()` | Supported | Matches. `EmailDto`. Returns 202. |
| A6 | `POST /auth/reset-password` | `publicEndpoints().auth.resetPassword()` | Supported | Matches. `ResetPasswordDto`. Returns 204. |
| A7 | `POST /auth/login` | `publicEndpoints().auth.login()` | Supported | Matches. `LoginDto`. Returns 200. Session cookie set. |
| A8 | `GET /auth/session` | `publicEndpoints().auth.session()` | Supported | Matches. Returns 200. Response body `{}` — user shape unverified (requires backend confirmation). |
| A9 | `POST /auth/logout` | `publicEndpoints().auth.logout()` | Supported | Matches. Requires `x-csrf-token` header in backend spec; frontend sets `csrf: true`. CSRF source unresolved. |
| A10 | `POST /auth/logout-all` | `publicEndpoints().auth.logoutAll()` | Supported | Matches. Returns 204. |
| A11 | `POST /auth/change-password` | `publicEndpoints().auth.changePassword()` | Supported | Matches. `ChangePasswordDto` (minLength 15 new password). Returns 204. |

**Auth notes:** All auth endpoints are supported at the path/method level. Response bodies for `session`, `registration-terms`, and `login` are undocumented in the spec (`{}`) — requires backend confirmation before typing responses beyond `unknown`.

---

## Organizations

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| O1 | `GET /organizations` | None | Missing from frontend | Lists the signed-in user's organizations. No frontend equivalent. |
| O2 | `GET /organizations/{id}` | None | Missing from frontend | Organization detail. No frontend equivalent. |
| O3 | `POST /organizations/applications` | None | Missing from frontend | Vendor application. `ApplicationDto` documented. Returns 201. |
| O4 | `POST /organizations/service-provider-applications` | None | Missing from frontend | Service provider application. `ServiceProviderApplicationDto` documented. Returns 201. |
| O5 | `PATCH /organizations/{id}/application` | None | Missing from frontend | Resubmit application. `ResubmitApplicationDto` (adds `expectedVersion`). |
| O6 | `PATCH /organizations/{id}/service-provider-application` | None | Missing from frontend | Resubmit SP application. `ResubmitServiceProviderApplicationDto`. |
| O7 | `POST /organizations/{id}/memberships` | None | Missing from frontend | Add member. `MemberDto` (email + role enum CATALOG/FULFILMENT/COORDINATOR/FINANCE). |
| O8 | `DELETE /organizations/{id}/memberships/{userId}` | None | Missing from frontend | Remove member. Returns 204. |

**Organizations notes:** Entirely missing from the frontend SDK. The frontend currently models vendors as a flat `Vendor` type with `vendorId` on `User`; the backend uses organizations with applications, memberships, and roles. New SDK endpoints and types are required.

---

## Organization Applications

Same as Organizations rows O3–O6 above. Applications are the mechanism by which a user becomes a vendor or service provider on the backend. The frontend has no application flow — registration creates a customer user directly.

---

## Organization Memberships

Same as Organizations rows O7–O8. Backend membership roles: `CATALOG`, `FULFILMENT`, `COORDINATOR`, `FINANCE`. Frontend roles are `customer`, `vendor_owner`, `vendor_staff`, `admin`, `super_admin`, `support` — no mapping exists.

---

## Catalog

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| C1 | `GET /catalog/offers` | `publicEndpoints().catalog.products()` | Partially supported | Backend lists sale/rental offers (`mode` query: SALE/RENTAL). Frontend lists products. Different domain model — offer ≠ product. |
| C2 | `GET /catalog/products` | `publicEndpoints().catalog.products()` | Partially supported | Path matches semantically but backend returns products in a different shape; frontend `Product` type does not match backend product schema (backend product schema is `{}` — undocumented). |
| C3 | `GET /catalog/offers/{offerId}/availability` | None | Missing from frontend | Availability check with `startsAt`/`endsAt` date-time params. No frontend equivalent. |

**Catalog notes:** Frontend `products` endpoint maps loosely to backend `catalog/offers` and `catalog/products` but the domain models differ (offer with mode SALE/RENTAL vs product with listingType sale/rent). Response schemas are `{}` in the spec — requires backend confirmation.

---

## Vendor Offers

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| VO1 | `GET /organizations/{organizationId}/offers` | None | Missing from frontend | List an org's offers (DRAFT/SUBMITTED/REJECTED/PUBLISHED/ARCHIVED). |
| VO2 | `POST /organizations/{organizationId}/offers` | None | Missing from frontend | Create offer. `CreateOfferDto` (productId, mode, amountMinor, currency, rateUnit). |
| VO3 | `PATCH /organizations/{organizationId}/offers/{id}` | None | Missing from frontend | Update offer. `UpdateOfferDto` (adds `expectedVersion` for optimistic concurrency). |
| VO4 | `POST /organizations/{organizationId}/offers/{id}/submit` | None | Missing from frontend | Submit offer for review. `VersionDto` (`expectedVersion`). |
| VO5 | `POST /organizations/{organizationId}/offers/{id}/archive` | None | Missing from frontend | Archive offer. `VersionDto`. |

**Vendor offers notes:** Entirely missing from the frontend SDK. The frontend has `seller.createProduct` under `/vendors/:vendorId/products` which does not exist on the backend. New SDK endpoints required under an organization-scoped group.

---

## Inventory

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| I1 | `POST /organizations/{organizationId}/offers/{offerId}/stock` | None | Missing from frontend | Initialize stock. `CreateStockDto` (kind QUANTITY/SERIALIZED, initialOnHand). CSRF required. |
| I2 | `GET /organizations/{organizationId}/offers/{offerId}/stock` | None | Missing from frontend | Get stock. CSRF optional. |
| I3 | `POST /organizations/{organizationId}/offers/{offerId}/stock/adjustments` | None | Missing from frontend | Adjust stock. `AdjustStockDto` (expectedVersion, delta, reason). CSRF required. |
| I4 | `PUT /organizations/{organizationId}/offers/{offerId}/rental-terms` | None | Missing from frontend | Configure rental terms. `RentalTermsDto` (preparationMinutes, returnBufferMinutes, min/max duration, expectedVersion). CSRF required. |
| I5 | `GET /organizations/{organizationId}/offers/{offerId}/rental-terms` | None | Missing from frontend | Get rental terms. CSRF optional. |
| I6 | `POST /organizations/{organizationId}/assets` | None | Missing from frontend | Create asset. `CreateAssetDto` (productId, serialNumber, conditionNote, saleOfferId, rentalOfferId). CSRF required. |
| I7 | `GET /organizations/{organizationId}/assets` | None | Missing from frontend | List assets (status filter). CSRF optional. |
| I8 | `PATCH /organizations/{organizationId}/assets/{id}` | None | Missing from frontend | Update asset. `UpdateAssetDto` (expectedVersion, status, conditionNote, reason). CSRF required. |
| I9 | `POST /organizations/{organizationId}/assets/{id}/blocks` | None | Missing from frontend | Block asset. `BlockAssetDto` (startsAt, endsAt, reason). CSRF required. |
| I10 | `DELETE /organizations/{organizationId}/assets/{id}/blocks/{blockId}` | None | Missing from frontend | Release block. CSRF required. |
| I11 | `GET /organizations/{organizationId}/assets/{id}/calendar` | None | Missing from frontend | Asset calendar (startsAt/endsAt required). CSRF optional. |

**Inventory notes:** Entirely missing from the frontend SDK. The frontend has `seller.updateStock` under `/vendors/:vendorId/inventory/:productId` which does not exist on the backend. All inventory mutations require CSRF.

---

## Availability

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| AV1 | `GET /catalog/offers/{offerId}/availability` | None | Missing from frontend | Check availability for a date range. Listed under Catalog above. |

---

## Reservations

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| R1 | `POST /reservations` | None | Missing from frontend | Create hold. `CreateHoldDto` (offerId, expectedOfferVersion, quantity, startsAt, endsAt, expectedTermsVersion). Requires `Idempotency-Key` header. CSRF optional. |
| R2 | `GET /reservations` | None | Missing from frontend | List user's reservations (page/limit). CSRF optional. |
| R3 | `GET /reservations/{id}` | None | Missing from frontend | Reservation detail. CSRF optional. |
| R4 | `POST /reservations/{id}/release` | None | Missing from frontend | Release hold. CSRF optional. |
| R5 | `GET /reservations/{id}/checkout` | None | Missing from frontend | Checkout quote for a reservation. No body. CSRF not listed. |

**Reservations notes:** Entirely missing from the frontend SDK. Idempotency key is required on creation. The frontend checkout flow uses `/cart/quote` and `/checkout/confirm` which do not exist on the backend.

---

## Checkout

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| Ch1 | `GET /reservations/{id}/checkout` | `publicEndpoints().checkout.quote()` | Partially supported | Backend checkout quote is tied to a reservation ID. Frontend posts a `CartQuoteRequest` to `/cart/quote` (backend path does not exist). |
| Ch2 | `PUT /staff/offers/{offerId}/checkout-terms` | None | Missing from frontend | Configure checkout terms per offer. `CheckoutTermsDto`. CSRF required. |
| Ch3 | `GET /staff/offers/{offerId}/checkout-terms` | None | Missing from frontend | Get checkout terms. CSRF optional. |
| Ch4 | `POST /orders` | `publicEndpoints().checkout.confirm()` | Partially supported | Backend creates an order from a reservation. Requires `Idempotency-Key`. Frontend confirms a payment intent. |
| Ch5 | `GET /orders` | None | Missing from frontend | List user's orders. |
| Ch6 | `GET /orders/{id}` | None | Missing from frontend | Order detail. |
| Ch7 | `POST /orders/{id}/cancel` | None | Missing from frontend | Cancel order. |

**Checkout notes:** Backend checkout is reservation-driven (`/reservations/{id}/checkout`, `/orders`), not cart-driven (`/cart/quote`, `/checkout/confirm`). Payment-intent/payment-confirmation endpoints are absent from the spec — see payment blockers.

---

## Orders

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| OR1 | `POST /orders` | `publicEndpoints().checkout.confirm()` | Partially supported | Backend `CreateOrderDto` (reservationId, expectedCheckoutTermsVersion, expectedTotalMinor, currency). Requires `Idempotency-Key`. Frontend confirms checkout with `ConfirmCheckoutRequest`. |
| OR2 | `GET /orders` | `publicEndpoints().me.orders()` | Partially supported | Path concept matches but backend `/orders` is not under `/me`. Frontend `me/orders` does not exist on backend. |
| OR3 | `GET /orders/{id}` | `publicEndpoints().me.order()` | Partially supported | Same path-prefix mismatch. |
| OR4 | `POST /orders/{id}/cancel` | None | Missing from frontend | Cancel order. CSRF optional. |

**Orders notes:** Backend orders are top-level `/orders`, not nested under `/me`. Frontend `me/orders` and `me/order/:id` paths do not exist on the backend.

---

## Staff / Admin

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| S1 | `GET /admin/organizations` | None | Missing from frontend | Org review queue (page/limit/status/kind). |
| S2 | `POST /admin/organizations/{id}/review` | None | Missing from frontend | Review decision. `ApplicationReviewDto` (APPROVE/REJECT/REQUEST_MORE_INFORMATION, expectedVersion). |
| S3 | `POST /admin/organizations/{id}/suspend` | None | Missing from frontend | Suspend org. `ReasonDto` (expectedVersion, reason). |
| S4 | `POST /admin/products` | None | Missing from frontend | Staff product creation. `CreateProductDto` (name). Returns 201. |
| S5 | `GET /admin/offers` | None | Missing from frontend | Offer review queue. |
| S6 | `POST /admin/offers/{id}/review` | None | Missing from frontend | Offer review decision. `ReviewDto` (APPROVE/REJECT, expectedVersion). |

**Staff/admin notes:** Frontend admin has vendor approve/reject/suspend under `/admin/vendors/:id/*`, product approve/flag/delete under `/admin/products/:id/*`, disputes, payouts, users, settings, audit logs, exports. Backend admin is organized around organizations and offers, not vendors/products. No direct path overlap except the general admin domain.

---

## Health

| # | Backend endpoint | Frontend SDK | Status | Notes |
|---|-----------------|--------------|--------|-------|
| H1 | `GET /health/live` | None | Missing from frontend | Liveness probe. |
| H2 | `GET /health/ready` | None | Missing from frontend | Readiness probe (503 if DB/migration unavailable). |

**Health notes:** Entirely missing from the frontend SDK.

---

## Endpoints in frontend with NO backend equivalent

These frontend SDK methods target paths that do not appear in the live OpenAPI specification:

| Frontend endpoint | Path | Status |
|---|------|--------|
| `catalog.categories` | `/categories` | Missing from backend specification |
| `catalog.vendors` | `/vendors` | Missing from backend specification |
| `catalog.vendor` | `/vendors/:slug` | Missing from backend specification |
| `catalog.manufacturers` | `/manufacturers` | Missing from backend specification |
| `catalog.manufacturer` | `/manufacturers/:slug` | Missing from backend specification |
| `catalog.search` | `/search` | Missing from backend specification |
| `catalog.reviews` / `createReview` | `/products/:id/reviews` | Missing from backend specification |
| `services.*` | `/service-categories`, `/services`, `/service-requests` | Missing from backend specification |
| `checkout.quote` | `/cart/quote` | Missing from backend specification |
| `checkout.createPaymentIntent` | `/checkout/payment-intent` | Missing from backend specification |
| `me.*` | `/me`, `/me/orders`, `/me/addresses`, etc. | Missing from backend specification |
| `live.*` | `/live/sessions`, `/live/sessions/:id/messages` | Missing from backend specification |
| `content.*` | `/content/pages`, `/business/quotes` | Missing from backend specification |
| `seller.*` | `/vendors/:vendorId/*` | Missing from backend specification |
| `admin.vendors`, `admin.products`, `admin.disputes`, `admin.payouts`, `admin.users`, `admin.settings`, `admin.auditLogs`, `admin.exports` | `/admin/vendors/*`, `/admin/products/*`, etc. | Missing from backend specification |

---

## CSRF requirements (from backend spec)

Authenticated mutations requiring `x-csrf-token`:
- `POST /auth/logout` (explicitly required)
- `POST /organizations/{organizationId}/offers/{offerId}/stock`
- `POST /organizations/{organizationId}/offers/{offerId}/stock/adjustments`
- `PUT /organizations/{organizationId}/offers/{offerId}/rental-terms`
- `POST /organizations/{organizationId}/assets`
- `PATCH /organizations/{organizationId}/assets/{id}`
- `POST /organizations/{organizationId}/assets/{id}/blocks`
- `DELETE /organizations/{organizationId}/assets/{id}/blocks/{blockId}`
- `POST /reservations` (optional per spec, marked `required: false`)
- `POST /orders` (optional per spec, marked `required: false`)
- `PUT /staff/offers/{offerId}/checkout-terms`

CSRF token acquisition is **not documented** anywhere in the spec. The frontend SDK preserves fail-closed behaviour: if `getCsrfToken` is not configured, authenticated mutations throw `csrf_token_unavailable`. This must remain until the backend documents the token source.

---

## Idempotency

| Endpoint | Header | Status |
|---|---|---|
| `POST /reservations` | `Idempotency-Key` (required) | Frontend does not implement idempotency keys. |
| `POST /orders` | `Idempotency-Key` (required) | Frontend does not implement idempotency keys. |

**Discrepancy:** The OpenAPI spec lists both `idempotency-key` (lowercase) and `Idempotency-Key` (canonical) on the same operations. These must be treated as one header; the canonical form `Idempotency-Key` should be sent. Requires backend confirmation.

---

## Response schemas undocumented (requires backend confirmation)

The following operations have `{}` (empty) response bodies in the spec:
- `GET /auth/registration-terms`
- `GET /auth/session`
- `GET /auth/login`
- `GET /catalog/offers`
- `GET /catalog/products`
- `GET /catalog/offers/{offerId}/availability`
- `GET /organizations`
- `GET /organizations/{id}`
- `GET /organizations/{organizationId}/offers`
- `GET /organizations/{organizationId}/offers/{id}`
- `GET /organizations/{organizationId}/offers/{offerId}/stock`
- `GET /organizations/{organizationId}/offers/{offerId}/rental-terms`
- `GET /organizations/{organizationId}/assets`
- `GET /organizations/{organizationId}/assets/{id}`
- `GET /organizations/{organizationId}/assets/{id}/calendar`
- `GET /admin/organizations`
- `GET /admin/offers`
- `GET /reservations`
- `GET /reservations/{id}`
- `GET /reservations/{id}/checkout`
- `GET /orders`
- `GET /orders/{id}`
- `GET /health/live`
- `GET /health/ready`

No frontend types should be fabricated for these. Use `unknown` or isolated unresolved types until the backend provides schemas.

---

## Summary counts

| Category | Supported | Partially supported | Missing from frontend | Missing from backend spec | Requires confirmation |
|---|---|---|---|---|---|
| Authentication | 11 | 0 | 0 | 0 | 3 (session, registration-terms, login response bodies) |
| Organizations | 0 | 0 | 8 | 0 | 0 |
| Catalog | 0 | 2 | 1 | 7 (categories, vendors, manufacturers, search, reviews, etc.) | 2 |
| Vendor offers | 0 | 0 | 5 | 0 | 0 |
| Inventory | 0 | 0 | 11 | 0 | 0 |
| Reservations | 0 | 0 | 5 | 0 | 0 |
| Checkout | 0 | 2 | 3 | 3 (payment-intent, payment-confirmation, cart/quote) | 0 |
| Orders | 0 | 2 | 2 | 0 | 0 |
| Staff/admin | 0 | 0 | 6 | 6 (vendor approve/reject, product flag, disputes, payouts, users, settings, audit, exports) | 0 |
| Health | 0 | 0 | 2 | 0 | 0 |
