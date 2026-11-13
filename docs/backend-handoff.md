# Backend integration handoff

The frontend is currently a mocked demo. Implement the API contract in `docs/api-contract.md` and `docs/openapi.yaml` before disabling mocks in a shared or production environment.

## Replace the mock API

1. Implement `/api/v1` using the endpoint patterns in `packages/types/src/routes.ts` and the SDK contracts in `packages/sdk/src/endpoints/`.
2. Match the common `ApiErrorBody`, pagination, authentication, and money-unit behavior described in the API contract.
3. Enforce roles and vendor scope on the server. Client-side guards are only navigation and demo UX.
4. Configure each app's `.env.local` with the deployed API URL and `NEXT_PUBLIC_ENABLE_MOCKS=false`.
5. Configure the marketplace Stripe publishable key only if the backend supports real payment intents. The backend must create and confirm intents with a secret key; never place Stripe secret keys in frontend environment files.
6. Use the backend's documented `mitdrone_session` HTTP-only cookie and the `/auth/session` endpoint. Do not store session credentials in Web Storage, reuse the mock JWT secret, or treat client-decoded JWT claims as authorization.
7. Replace seeded content, manufacturer claims, compliance copy, demo metrics, and placeholder imagery with reviewed production data.
8. Verify the buyer, vendor, and admin journeys against the backend before release.

## Mock boundary

- Browser-side reads and writes use the MSW worker when mocks are enabled.
- Marketplace Server Component requests use the in-process `mockFetch` adapter.
- Vendor and admin dashboard operations are browser SDK calls handled by their MSW workers.
- The mock database is in-memory and resets when the app or test environment restarts; it is not persistent storage.
- Mock tokens are not secure and must not be accepted by a real backend.
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

## Authentication integration status and backend dependencies

The shared SDK uses `credentials: 'include'` for API requests and has removed the production
refresh-token and `/auth/me` assumptions. It models the documented registration, verification,
password-reset, session, logout, and password-change routes. Authenticated mutations fail closed
unless a CSRF-token provider is configured; the provider is deliberately not backed by a fabricated
endpoint or cookie reader.

The live Swagger contract does not document how a browser obtains the `x-csrf-token`. Before
enabling authenticated mutations, the backend team must document the token source, lifecycle, and
whether login/registration/verification are exempt despite Swagger listing the session security
scheme on those operations. Also confirm the response schema of `/auth/session` and `POST /auth/login`,
verification/reset link format and expiry/error codes, and the organization-application mapping to
the current vendor screens.

`NEXT_PUBLIC_ENABLE_MOCKS=true` keeps mock mode available during development. For staging, set it
to `false` and configure `NEXT_PUBLIC_API_URL` to the backend `/api/v1` base URL in all three apps.
Do not add production credentials or secrets to `.env.example`.

### Manual staging authentication check

1. Configure each app with the same intended API origin/cookie domain and `NEXT_PUBLIC_ENABLE_MOCKS=false`.
2. Confirm registration terms load, register with all required fields and accepted terms, and verify
   the API responds `202` without the frontend assuming a session body.
3. Use the actual email link/token supplied by the backend. Verify with the signup password; test
   invalid and expired tokens and resend behavior according to backend-provided error semantics.
4. Log in with verified and unverified users; record the actual status/body/cookie behavior. Confirm
   the user shown in the app comes from `/auth/session`, not a client-decoded token.
5. In browser devtools, verify the `mitdrone_session` cookie is HTTP-only, secure in HTTPS, and has
   the agreed SameSite/domain settings. Verify it is never copied into localStorage/sessionStorage.
6. Test authenticated read and mutation operations, including the agreed CSRF token source, failed
   CSRF, expired session, logout, and logout-all.
7. Test role boundaries independently in marketplace, vendor dashboard, and admin dashboard; verify
   server-side authorization and vendor application status separately from email verification.
8. Repeat with the deployed cross-origin origins and inspect CORS credential behavior. Mock tests do
   not substitute for this staging check.
