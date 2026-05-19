## 1. Shared Data Model
- [x] 1.1 Extend `check_ins` and related Eloquent models to support weekly program week numbers, weight and waist metrics, optional progress photos, doctor review metadata, and package-scoped weekly uniqueness without breaking the current admin or clinician credit-consuming check-in flow.
- [x] 1.2 Ensure active `user_packages` can resolve their source consultation, current meal-plan asset, and responsible doctor relationship for both patient and doctor views.

After 1.1 and 1.2, sections 2 and 3 can proceed in parallel.

## 2. Patient Program Workspace
- [x] 2.1 Expand the patient dashboard data contract to include profile health context from existing user fields, active package summaries, meal-plan download links, upcoming confirmed consultations, progress history, and a derived engagement feed.
- [x] 2.2 Add a patient weekly check-in submission flow for a selected active package with validation, optional photo upload, per-week duplicate prevention, and no consultation-credit deduction.
- [x] 2.3 Add patient-facing progress history and review-state UI so submitted check-ins can be tracked over time.

## 3. Doctor Program Review
- [x] 3.1 Add doctor routes, queries, and UI for an active-program patient roster limited to packages linked to consultations completed by the signed-in doctor.
- [x] 3.2 Add doctor access to a patient's ordered weekly check-in history, current meal-plan asset, and latest package status.
- [x] 3.3 Add doctor review actions that save follow-up notes or adjustment summaries against a weekly check-in and surface the reviewed state back to the patient workspace.

## 4. Storage and Automation
- [x] 4.1 Extend `ClinicAssetService` and related flows to store weekly progress photos and expose temporary access URLs for meal plans and progress media through the configured clinic asset disk.
- [x] 4.2 Add queued weekly check-in reminders for active packages and queued patient follow-up notifications after doctor review, following the existing outbound notification job pattern.

## 5. Validation
- [x] 5.1 Add feature tests for patient eligibility, weekly uniqueness rules, progress ordering, doctor authorization boundaries, review persistence, and asset-access behavior.
- [x] 5.2 Run `php artisan test` and `prompter validate add-patient-program-workspace --strict --no-interactive` before marking the change complete.

## Post-Implementation
- [x] Update `AGENTS.md` in the project root if implementation introduces new ongoing-care conventions that future assistants need to follow.
