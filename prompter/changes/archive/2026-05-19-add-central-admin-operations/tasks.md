## 1. Foundation
- [x] 1.1 Add the missing admin-facing data structures needed for content records and broadcast audit history while keeping `users.role` as the only role source of truth.
- [x] 1.2 Expand admin routes, navigation, and shared page structure so dashboard, packages, reports, content, broadcasts, and users are reachable behind the existing verified admin middleware.

## 2. Dashboard And Commerce
- [x] 2.1 Expand the admin dashboard to show KPI cards and recent operational activity derived from users, bookings, payments, packages, and patient package entitlements.
- [x] 2.2 Implement package and pricing administration with create, update, review, and deactivate flows that preserve historical payment and entitlement records.
- [x] 2.3 Implement paid revenue reporting and conversion-funnel analytics using transactional aggregates, with filtering suitable for back-office review.

## 3. Communications And Content
- [x] 3.1 Implement WhatsApp broadcast drafting, audience selection, queued dispatch, and audit history using the existing provider-oriented notification stack.
- [x] 3.2 Implement educational or site content CRUD, publishing state, and optional asset attachment management for admin-maintained content referenced by the platform.

## 4. User Administration
- [x] 4.1 Implement an admin user directory with filtering by role and verification state plus profile review details needed for operations.
- [x] 4.2 Implement authorized team-managed account provisioning and role updates for `patient`, `doctor`, and `admin`, including doctor-profile capture when a doctor account is created or reassigned.

## 5. Validation
- [x] 5.1 Add or extend feature tests for admin authorization, package administration, reports, broadcasts, content management, and user management flows.
- [x] 5.2 Run the relevant targeted PHP feature suite for admin flows and the project's frontend verification command for the new admin pages.
- [x] 5.3 Update `AGENTS.md` if the implemented admin flows add new domain rules or operating constraints.
