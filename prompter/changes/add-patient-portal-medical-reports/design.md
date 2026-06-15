## Context
The source document in `docs/fitur-patient-portal-medical-report.md` requests automatic patient accounts, a patient portal, and per-session medical reports. The current application is Laravel 12 with Inertia/React and PostgreSQL. Existing domain notes and implementation currently block patient login: `AuthenticatedSessionController` rejects non-staff roles, `AdminUserController` only provisions `doctor`, `admin`, and `super_admin`, and migration `2026_06_01_000002_refactor_to_staff_only_workflow.php` nulled prior `patient` roles.

The current data model already treats `users` as the patient identity for bookings, payments, packages, consultations, and check-ins. Existing Prompter specs also already describe patient medical-record and program-engagement workspaces. This proposal therefore favors reusing `users` as the patient account/profile record instead of adding a separate `patients` table from the reference document.

## Goals / Non-Goals
- Goals: Re-enable secure patient login for read-only portal access, auto-provision patient accounts from staff-entered patient data, expose finalized session reports and progress metrics, and preserve staff-only operational workflows.
- Goals: Keep implementation aligned with existing Laravel/Inertia routes, role middleware, `users`, `consultations`, `user_packages`, and `check_ins` records.
- Non-Goals: Public patient self-registration, patient mutation of clinical records, full standalone REST API parity with the reference document, multi-clinic tenancy, or replacing the existing user-package/check-in data model.
- Non-Goals: Inventory, POS, FIFO costing, or full accounting changes.

## Decisions
- Decision: Use `users.role = patient` for patient accounts rather than introducing a new `patients` table.
- Alternatives considered: A separate `patients` table could mirror the reference SQL, but it would duplicate existing patient relationships across bookings, payments, packages, consultations, and check-ins and create a larger migration.
- Decision: Phone number is the patient login identifier, while staff may continue using the existing email/password login flow unless implementation chooses a unified identifier field.
- Alternatives considered: Email-only login is already present, but the requested flow depends on phone-first patient onboarding and many clinic patients may not have email addresses.
- Decision: Auto-created patient passwords are temporary credentials derived from the last four digits of the normalized phone number only when immediately paired with forced password rotation.
- Alternatives considered: Sending random one-time setup links is more secure, but the source request explicitly asks for last-four-digit default passwords. Implementation should keep the value temporary, force rotation before portal access, and avoid logging it.
- Decision: Patient-visible reports should be derived from completed/finalized consultation records plus any report-specific fields added during implementation, not from an isolated report store unless detailed implementation analysis proves the existing consultation table is insufficient.
- Alternatives considered: A new `medical_reports` table would match the source document, but existing doctor medical-record specs already derive archive entries from `consultations` and `check_ins`.

## Risks / Trade-offs
- Risk: Re-enabling patient login reverses a prior staff-only policy and may expose unreviewed routes to patient sessions. Mitigation: add explicit patient route groups, update role middleware tests, and keep operational route authorization unchanged.
- Risk: Phone-based default passwords are weak if not rotated immediately. Mitigation: store `must_change_password`, block all portal pages except password-change/logout until rotation succeeds, and send credentials only through the configured patient contact channel.
- Risk: Existing patient rows may have `role = null` after the staff-only migration. Mitigation: migration/backfill tasks must explicitly decide which existing records are eligible to become patient accounts and avoid changing guest-only bookings.
- Risk: Report visibility may disclose draft or clinician-only notes. Mitigation: only finalized report fields marked patient-visible are exposed in patient routes.

## Migration Plan
1. Add any required user fields such as `must_change_password`, phone-login uniqueness/normalization support, and patient contact notification metadata.
2. Re-enable `patient` as a supported role without changing existing staff accounts or guest bookings.
3. Backfill only explicitly eligible existing registered patient users; keep guest bookings accountless.
4. Add patient route groups and controllers behind `auth`, `verified`, and `role:patient` or equivalent middleware.
5. Add report fields or report table only after confirming whether `consultations` can store all required patient-visible report data.
6. Rollback by disabling patient routes and preserving stored records; do not delete historical reports, consultations, or patient users.

## Open Questions
- Should password recovery use WhatsApp only, or should email reset remain available when a patient has an email address?
- Which existing `role = null` users are eligible to be restored to `patient`, and should that be automatic or admin-reviewed?
