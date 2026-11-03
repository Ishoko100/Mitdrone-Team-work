# API contract inventory

The shared URL patterns live in [`packages/types/src/routes.ts`](../packages/types/src/routes.ts). The SDK methods in `packages/sdk/src/endpoints/` provide the HTTP method and request/response TypeScript types; MSW handlers implement the demo behavior. Keep all three aligned when changing an endpoint.

Regenerate the OpenAPI path and method inventory after editing routes or SDK methods:

```bash
npm run openapi:generate
```

`docs/openapi.yaml` is generated from shared route patterns and the SDK's TypeScript request/response types. It includes path and query parameters, JSON request bodies, nested response schemas, shared error bodies, and authentication requirements. Regenerate it after changing routes or SDK endpoint types with `npm run openapi:generate`.

The OpenAPI document captures TypeScript structure (including optional/required properties, arrays, and literal unions). It does not infer runtime refinements such as Zod minimum lengths, email formats, or coercion rules; the exported Zod validators in `packages/types/src/api.ts` remain authoritative for those form-validation constraints. The backend team should agree on any additional server validation as part of API implementation.

## Endpoint groups

| Group              | Route patterns                                                                                                                                                                                  | SDK / mock source                                                                      | Auth                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Authentication     | `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`; `GET /auth/me`                                                                                  | `publicEndpoints().auth`; `handlers/auth.ts`                                           | Public except logout and me                                                   |
| Catalog and search | `GET /products`, `/products/:idOrSlug`, `/products/:id/reviews`, `/categories`, `/vendors`, `/vendors/:slug`, `/manufacturers`, `/manufacturers/:slug`, `/search`; `POST /products/:id/reviews` | `publicEndpoints().catalog`; `handlers/catalog.ts`                                     | Public reads; review writes require a user                                    |
| Services           | `GET /service-categories`, `/services`, `/services/:slug`, `/service-requests`, `/service-requests/:id/quotes`; `POST /service-requests`                                                        | `publicEndpoints().services`; `handlers/services.ts`                                   | Public discovery; project creation is authenticated                           |
| Checkout           | `POST /cart/quote`, `/checkout/payment-intent`, `/checkout/confirm`                                                                                                                             | `publicEndpoints().checkout`; `handlers/shop.ts`                                       | Authenticated                                                                 |
| Customer account   | `GET/PATCH /me`; `GET /me/orders`, `/me/orders/:id`, `/me/addresses`, `/me/referrals`, `/me/notifications`; `POST /me/addresses`, `/me/notifications/:id/read`; `DELETE /me/addresses/:id`      | `publicEndpoints().me`; `handlers/shop.ts`                                             | Authenticated                                                                 |
| Live and content   | `GET /live/sessions`, `/live/sessions/:id`, `/live/sessions/:id/messages`, `/content/pages`, `/content/pages/:slug`; `POST /live/sessions/:id/messages`, `/business/quotes`                     | `publicEndpoints().live` and `.content`; `handlers/shop.ts` and `handlers/services.ts` | Public reads; posting live messages requires a user; business quote is public |
| Vendor             | `/vendors/:vendorId/{dashboard,analytics,settings,products,orders,inventory,payouts,balance,ledger,bank,kyc,services,service-requests}` plus item/action routes listed in `routes.ts`           | `sellerEndpoints`; `handlers/seller.ts`                                                | Vendor role and vendor scope; staff permissions vary by action                |
| Admin              | `/admin/{dashboard,vendors,products,orders,disputes,payouts,users,settings,audit-logs,exports}` plus detail/action routes in `routes.ts`                                                        | `adminEndpoints`; `handlers/admin.ts`                                                  | Admin role guards; support has limited access                                 |

## Shared request schemas

Zod validators currently exported from `@mitdrone/types` include `loginSchema`, `registerSchema`, `addressSchema`, `productFormSchema`, `quoteRequestSchema`, and `serviceRequestSchema`. Extend these validators when backend validation rules change. Other request shapes are currently expressed as TypeScript types or inline SDK types.

## Common behavior

- API base path is `/api/v1`.
- Paginated responses use the shared `Paginated<T>` shape.
- Errors use `ApiErrorBody` (`code`, `message`, `status`, optional `fieldErrors`).
- Prices in API domain objects use integer minor units (kobo); form values with `Major` suffix use naira and are converted by the SDK/mock layer.
- Vendor-scoped routes must verify the authenticated vendor ID server-side. Never trust a vendor ID supplied only by the URL.
