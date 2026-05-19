## Context
The clinic needs one application that supports patient onboarding, doctor scheduling, payments, and admin operations without splitting the MVP across multiple codebases. The existing project documentation already points to Laravel, Inertia.js, React, PostgreSQL, Midtrans, and WhatsApp-based notifications.

## Goals / Non-Goals
- Goals:
  - Deliver a responsive web MVP that works well on desktop and mobile browsers.
  - Keep frontend and backend in one Laravel application for faster delivery.
  - Support the clinic's core operational flow: auth, booking, payment, confirmation, and dashboards.
- Non-Goals:
  - Native iOS or Android applications in MVP.
  - Real-time chat, full-text search, or advanced analytics in MVP.
  - Complex infrastructure beyond what is needed for fewer than 1,000 users.

## Decisions
- Decision: Use Laravel 12 with Inertia.js and React.
  - Alternatives considered: Laravel + Blade was simpler, but React fits the dashboard-driven UX better. A separate JS/TS frontend and API would add delivery overhead for MVP.
- Decision: Use PostgreSQL as the primary database.
  - Alternatives considered: MySQL would also work, but PostgreSQL is the stronger default for relational workflows and future extensibility.
- Decision: Use Docker in development and production.
  - Alternatives considered: A non-Docker VPS setup would reduce initial setup, but Docker improves reproducibility across local and server environments.
- Decision: Use a VPS with development and production environments only.
  - Alternatives considered: PaaS would be simpler, but the team chose VPS control. Staging is deferred to keep MVP operations lean.

## Risks / Trade-offs
- No staging environment increases release risk -> mitigate with strong local QA, seed data, and rollback-friendly deployments.
- Health-related data may expand over time -> mitigate by keeping medical data access role-scoped and revisiting privacy controls as scope grows.
- Queue-backed notifications introduce operational dependencies -> mitigate with simple queue monitoring and retry policies.

## Migration Plan
1. Scaffold the Laravel project and baseline Docker services.
2. Implement authentication and role boundaries.
3. Add scheduling, booking, and payment workflows.
4. Build the role-based dashboards.
5. Deploy to the production VPS after local acceptance testing.

## Open Questions
- Will consultations be online, offline, or hybrid in MVP?
- Will package purchase after consultation remain a phase-two capability or be added before launch?
