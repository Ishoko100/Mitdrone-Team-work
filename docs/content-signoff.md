# Frontend content sign-off

The application is built around demo data. Before the frontend is called production-ready, the Mitdrone product/content owners should review or replace the items below. This is content approval for the frontend; API and backend implementation are tracked in the separate [backend handoff](./backend-handoff.md).

## Required owner review

- [ ] **Regulatory guidance:** Review every compliance page and any mention of NCAA permits, registration, operating rules, or verification. The seeded compliance pages explicitly carry placeholder copy in `packages/data/src/extras.ts`.
- [ ] **Manufacturer directory:** Confirm that Terra Drones, Briech Drones, and Ken Drone are real approved listings, that each is correctly described as Nigerian, and that capability and industry claims are authorized. Their seeded profiles are marked as placeholders in `packages/data/src/people.ts`.
- [ ] **Manufacturer and product claims:** Approve brand names, descriptions, specifications, compatibility, warranty, availability, and prices shown in the illustrative catalog. Product seed data is explicitly identified as illustrative in `packages/data/src/commerce.ts`.
- [ ] **Seller and service claims:** Confirm seller verification badges, service-provider qualifications, coverage areas, turnaround promises, returns, warranty, and buyer-protection wording.
- [ ] **Images and documents:** Replace local product/manufacturer placeholder SVGs and placeholder KYC document links with reviewed assets and real managed files.
- [ ] **Editorial pages and event listings:** Replace placeholder support, learning, business, live-event, and company copy, and confirm any named speakers or scheduled sessions.

## Frontend interaction review

- [ ] Review all three apps at desktop, tablet, and mobile widths.
- [ ] For each primary route, check loading, empty, error, success, validation, and permission-denied states where applicable.
- [ ] Walk the buyer purchase, vendor listing/order, and admin moderation journeys using production-like data once an API is available.
- [ ] Confirm route links, page titles/metadata, and accessibility labels with product/design owners.

Automated checks cover representative buyer checkout, vendor product submission, and admin vendor approval paths. They do not replace this content and visual sign-off.
