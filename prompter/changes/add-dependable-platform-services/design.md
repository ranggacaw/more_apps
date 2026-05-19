## Context
EPIC-008 defines the shared operational foundation that the booking, payment, dashboard, and care-delivery flows depend on. The current codebase already contains a first pass of this foundation: role middleware in `bootstrap/app.php`, booking and payment routes in `routes/web.php`, queue-backed notifications in `app/Jobs/SendBookingNotificationJob.php`, scheduler tasks in `routes/console.php`, a Midtrans service in `app/Services/MidtransService.php`, and Docker plus environment-backed configuration in `docker-compose.yml`, `.env.example`, and `config/*.php`.

The current implementation is still incomplete against the epic scope. The schema covers doctors, availabilities, slots, bookings, and payments, but not packages, user packages, check-ins, or consultations. Route protection is role-based but not consistently verified-gated. Storage is configurable, but the required patient-upload and meal-plan workflows are not yet defined. The platform also needs clearer operational rules for provider swaps, queued work, and deployment expectations.

## Goals / Non-Goals
- Goals:
  - Define the platform-service requirements needed to support reliable clinic operations in a single Laravel application.
  - Capture the missing schema, security, automation, storage, and runtime expectations in discrete capabilities.
  - Keep the proposal aligned to the current implementation so follow-on work can extend existing patterns rather than replace them.
- Non-Goals:
  - Redesign patient, doctor, or admin UI flows beyond the operational requirements needed to support them.
  - Introduce a separate API frontend split, multi-region deployment, or a full observability platform.
  - Lock the implementation to a single WhatsApp or meeting vendor when the epic explicitly allows approved alternatives.

## Decisions
- Decision: Split the epic into five focused capabilities instead of one large platform spec.
  - Alternatives considered: A single omnibus capability would be faster to draft, but it would be harder to validate, archive, and implement incrementally.
- Decision: Treat operational verification, role checks, and route protection as a dedicated access-control capability.
  - Alternatives considered: Folding access into the MVP auth requirement would duplicate the existing broad `clinic-mvp` change and make route-level acceptance harder to audit.
- Decision: Keep external integrations provider-oriented and environment-driven.
  - Alternatives considered: Naming one fixed provider in each requirement would conflict with the documented Fonnte-or-Wablas and Zoom-or-Google-Meet flexibility.
- Decision: Preserve the single Laravel app topology with separate web, queue, scheduler, and database runtime concerns.
  - Alternatives considered: Splitting services into multiple deployable applications would exceed the epic scope and current project assumptions.

## Risks / Trade-offs
- The active `add-more-clinic-platform-mvp` proposal already describes the MVP at a high level, so this change adds detail in adjacent capabilities rather than rewriting that broad scope.
- Verification expectations are broader in the epic and docs than in the current route setup, so the eventual implementation may need to choose between Laravel email verification, OTP-backed verification, or a combined flow.
- Adding the remaining clinical entities increases schema breadth, but keeping them in explicit capabilities reduces the chance of hidden coupling during implementation.

## Migration Plan
1. Extend the data model and access-control boundaries first, because later integrations and scheduler behavior depend on those records and permissions.
2. Harden payment and outbound-service orchestration next so confirmation flows become retry-safe and provider-aware.
3. Add scheduler and storage workflows after the core entities and jobs exist.
4. Finish with validation coverage and runtime smoke checks for local and production-like execution.

## Open Questions
- Should the eventual verification gate be satisfied by Laravel's built-in verified-user flow, an OTP-specific clinic flow, or both?
- Will package activation consume a stored consultation credit field on the user record, a consultation record, or a dedicated entitlement ledger?
