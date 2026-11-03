# MITDRONE

Frontend-only drone marketplace monorepo. The marketplace, vendor dashboard and admin dashboard use a shared typed SDK and MSW-backed demo data. The mock setup is for development and demonstrations; it is not production authentication or payment processing.

| App              | Path                    | Port |
| ---------------- | ----------------------- | ---- |
| Marketplace      | `apps/marketplace-web`  | 3000 |
| Vendor dashboard | `apps/vendor-dashboard` | 3001 |
| Admin dashboard  | `apps/admin-dashboard`  | 3002 |

## Requirements and startup

- Node.js 20.11 or newer
- npm 10 or newer

```bash
nvm use
npm install
npx playwright install chromium # one-time browser install for E2E tests
npm run dev
```

Each app has a `.env.example`. Copy the relevant file to that app's `.env.local` when changing settings. Defaults enable mocks and use the local API URL `http://localhost:4000/api/v1`; no backend is needed for the demo.

## Demo accounts

All seeded accounts use `Password123!`.

| App                  | Account                                |
| -------------------- | -------------------------------------- |
| Marketplace customer | `ibrahim@mitdrone.test`                |
| Vendor owner         | `vendor@mitdrone.test`                 |
| Vendor staff         | `staff@mitdrone.test`                  |
| Pending vendor       | `owner@newwave-aviation.mitdrone.test` |
| Admin                | `admin@mitdrone.test`                  |
| Super admin          | `superadmin@mitdrone.test`             |
| Support              | `support@mitdrone.test`                |

## Useful commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Mock and payment behavior

Browser requests are handled by the MSW worker. Server-rendered marketplace requests use the in-process mock fetch adapter. Set `NEXT_PUBLIC_ENABLE_MOCKS=false` and point `NEXT_PUBLIC_API_URL` to the backend to use a real API. See [the backend handoff](docs/backend-handoff.md) before switching environments.

The default `pk_test_mitdrone_mock` value selects the local mock card form. A real Stripe test publishable key selects Stripe Elements, which contacts Stripe to create a PaymentMethod; order confirmation remains mocked until the API is replaced. No live charge is made by this frontend demo.

Mock JWTs are not a security boundary. Browser MSW cannot access server-only `NEXTAUTH_SECRET`, so browser-issued demo tokens use a public fallback signing key. The backend must issue and verify production tokens and set them in httpOnly cookies.

## API contract

The SDK and MSW handlers share route patterns from `packages/types/src/routes.ts`. The endpoint inventory is in [API contract](docs/api-contract.md), and the handoff steps are in [backend handoff](docs/backend-handoff.md). The OpenAPI document is in [docs/openapi.yaml](docs/openapi.yaml). The owner checklist for illustrative content and visual review is in [frontend content sign-off](docs/content-signoff.md).

## Current demo limitations

- Live sessions use a placeholder player, mock chat, and mock Q&A.
- Rental listings can be browsed and requested; vendor rental listing is marked as coming soon.
- Product and document uploads use local placeholder assets.
- Compliance copy is editorial placeholder content and requires Mitdrone compliance review before publication.
- Seeded manufacturers and marketplace metrics are illustrative demo data.
