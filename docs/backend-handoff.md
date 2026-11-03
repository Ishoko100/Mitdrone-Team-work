# Backend integration handoff

The frontend is currently a mocked demo. Implement the API contract in `docs/api-contract.md` and `docs/openapi.yaml` before disabling mocks in a shared or production environment.

## Replace the mock API

1. Implement `/api/v1` using the endpoint patterns in `packages/types/src/routes.ts` and the SDK contracts in `packages/sdk/src/endpoints/`.
2. Match the common `ApiErrorBody`, pagination, authentication, and money-unit behavior described in the API contract.
3. Enforce roles and vendor scope on the server. Client-side guards are only navigation and demo UX.
4. Configure each app's `.env.local` with the deployed API URL and `NEXT_PUBLIC_ENABLE_MOCKS=false`.
5. Configure the marketplace Stripe publishable key only if the backend supports real payment intents. The backend must create and confirm intents with a secret key; never place Stripe secret keys in frontend environment files.
6. Replace demo authentication with backend-issued access/session credentials in httpOnly, secure cookies. Do not reuse the mock JWT secret or treat client-decoded JWT claims as authorization.
7. Replace seeded content, manufacturer claims, compliance copy, demo metrics, and placeholder imagery with reviewed production data.
8. Verify the buyer, vendor, and admin journeys against the backend before release.

## Mock boundary

- Browser-side reads and writes use the MSW worker when mocks are enabled.
- Marketplace Server Component requests use the in-process `mockFetch` adapter.
- Vendor and admin dashboard operations are browser SDK calls handled by their MSW workers.
- The mock database is in-memory and resets when the app or test environment restarts; it is not persistent storage.
- Browser MSW cannot read server-only `NEXTAUTH_SECRET`. The browser mock uses a public demo signing fallback; mock tokens are not secure and should not be accepted by a real backend.
- The default Stripe placeholder key selects the local mock card form. A real publishable test key loads Stripe Elements; that UI contacts Stripe to create a PaymentMethod, while this demo's order API remains mocked.

## Known production replacements

| Demo implementation                               | Backend / production replacement                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| MSW endpoint handlers and in-memory seed database | Persistent API and database                                              |
| Mock JWT encoding and client-side role guards     | Server-issued credentials, verification, authorization, httpOnly cookies |
| Mock payment intent and order confirmation        | Backend Stripe intent lifecycle, webhook reconciliation, idempotency     |
| Local SVG product placeholders                    | Reviewed product photography and managed media storage                   |
| Live player placeholder and mock chat             | Streaming provider, moderation, real-time messaging                      |
| Illustrative seeded content and compliance copy   | Mitdrone-approved content and regulatory review                          |
