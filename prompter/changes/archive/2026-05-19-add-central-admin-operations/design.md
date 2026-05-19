## Context
EPIC-007 expands the clinic app from a mostly patient and doctor workflow into a real admin back office. The current codebase already has verified admin route protection, a small admin dashboard (`AdminDashboardController`, `resources/js/Pages/Admin/Dashboard.jsx`), and admin-authored package check-ins, but the broader modules described in `docs/more_apps_docs.md` section 6.3 are still missing. The source docs also reference `roles` and `educational_content` even though the live project uses `users.role` and has no existing content or broadcast persistence model.

## Goals / Non-Goals
- Goals:
  - Give admins a single in-app surface for KPI overview, package management, reporting, communications, content, and user administration.
  - Reuse existing transactional tables and provider abstractions where practical.
  - Keep the role model aligned with the current `users.role` enum values `patient`, `doctor`, and `admin`.
  - Make bulk communications and user-management changes auditable.
- Non-Goals:
  - Build a separate analytics warehouse or BI pipeline.
  - Introduce custom permissions beyond the current role-based access model.
  - Add complex campaign automation, audience journeys, or approval workflows.
  - Redesign patient or doctor experiences outside the admin-driven side effects needed by this epic.

## Decisions
- Decision: Keep role management anchored to `users.role` and treat admin user management as a team-managed workflow instead of introducing a separate `roles` table.
  - Alternatives considered: A normalized roles-and-permissions system would be more flexible, but it conflicts with the current domain rule in `AGENTS.md` and would expand the scope into an authorization redesign.
- Decision: Build reports from existing operational tables (`users`, `bookings`, `payments`, `packages`, `user_packages`) using server-side aggregates and date filters.
  - Alternatives considered: Materialized summaries or a separate analytics store could help at larger scale, but the epic assumptions already allow transactional reporting for the initial release.
- Decision: Treat package lifecycle control as create, update, and deactivate rather than destructive deletion so historical payments, consultations, and package entitlements remain valid.
  - Alternatives considered: Hard deletes or archive tables would complicate referential integrity and historical reporting without clear MVP value.
- Decision: Model broadcasts as queued admin-authored campaigns with saved audience scope, message content, delivery timestamps, and dispatch status.
  - Alternatives considered: Fire-and-forget job dispatch without persistence would be simpler, but it would leave no audit trail for a compliance-sensitive admin operation.
- Decision: Introduce a minimal educational or site content model with draft and published states plus optional asset support through the existing clinic asset storage rules in `clinic-storage-runtime`.
  - Alternatives considered: Managing site copy in code or seed data would not satisfy the requirement that admins manage content without direct database access.

## Risks / Trade-offs
- Undefined broadcast policy -> The docs do not define targeting, approvals, or opt-out behavior. The initial scope should keep audience rules minimal and audited, and implementation may still need business confirmation before broad sends are enabled.
- Doctor account management spans two aggregates -> Creating or converting a doctor account requires both `users` and `doctors` data, so admin user workflows must preserve consistency across both records.
- Transactional reporting can become expensive -> The proposed approach is suitable for MVP, but query tuning or precomputed summaries may be needed if dataset size or admin usage grows.
- Content scope can sprawl -> The proposal keeps this limited to simple educational or site content CRUD rather than a full CMS.

## Migration Plan
1. Approve the admin capability specs and design decisions.
2. Add any required schema for content and broadcast audit records before wiring controllers and pages.
3. Ship admin navigation and dashboard or reporting increments first, then communications and content, then user administration.
4. Backfill tests for authorization, historical-record preservation, and queued side effects before rollout.

## Open Questions
- Should WhatsApp broadcasts initially target all verified patients only, or should admins be able to segment by role and verification state from day one?
- Which product surfaces should consume admin-managed educational content in the first release: public marketing pages, patient dashboards, or both?
- Should admin-created doctor accounts require specialization and profile fields during creation, or can those details be completed in a later edit flow?
