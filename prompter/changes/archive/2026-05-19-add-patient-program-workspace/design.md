## Context
The current Laravel app already supports the front half of the clinic journey: patient registration and verification, consultation booking, Midtrans-backed payments, package checkout, package activation, doctor consultation completion, meal-plan PDF generation, and queue-backed outbound notifications. The ongoing-care workspace from EPIC-006 is still missing. `PatientDashboardController` currently returns only booking counts and recent consultations, `DoctorDashboardController` focuses on confirmed consultations rather than active packages, and `AdminCheckInController` records package check-ins that decrement remaining consultation credits.

The source docs for section 6.1 and 6.2 describe a richer patient dashboard plus a doctor active-patient review flow, but they also reference `user_health_data` and `notifications` models that do not exist in the current schema. For this proposal, the requested scope is to stay minimal: reuse existing patient profile fields instead of introducing a new health-data model, avoid a persistent in-app notifications table, and treat doctor program adjustments as review notes rather than full structured program revision history.

## Goals / Non-Goals
- Goals:
  - Define the missing patient and doctor ongoing-care requirements for active packages.
  - Reuse the current package, consultation, storage, and queue patterns wherever possible.
  - Add only the data needed for weekly progress submission, doctor review, and patient visibility.
- Non-Goals:
  - Introduce a standalone `user_health_data` domain model.
  - Build a persistent notification center backed by a new `notifications` table.
  - Create structured meal-plan versioning or a full program-revision subsystem.

## Decisions
- Decision: Reuse existing patient profile fields for health context.
  - Alternatives considered: Adding `user_health_data` now would match the original document names, but it would expand the proposal beyond the clarified scope and introduce schema work that the current app does not otherwise require.
- Decision: Extend the existing `check_ins` table instead of creating a second weekly-progress table.
  - Alternatives considered: A dedicated `weekly_check_ins` table would make semantics cleaner, but it would duplicate ownership and history relationships that already exist on `check_ins`. The lower-risk path is to enrich `check_ins` with weekly-progress fields while keeping existing package-credit usage records valid.
- Decision: Distinguish weekly progress entries from existing operational package check-ins by behavior and nullable fields rather than by a large new subsystem.
  - Alternatives considered: Introducing full event polymorphism or a new ledger model would be more explicit, but it is unnecessary for the minimal scope. Weekly patient submissions can use package-linked week data and review fields without decrementing credits, while existing admin or clinician operational entries keep their booking, consultation, and remaining-credit behavior.
- Decision: Derive the patient dashboard engagement feed from existing records instead of persisting a new notification inbox.
  - Alternatives considered: A stored notification center would provide richer history, but it would add a new domain model and synchronization concerns. The minimal approach is to build patient-facing engagement items from active package state, upcoming consultations, meal-plan availability, weekly check-in due state, and latest doctor review outcomes.
- Decision: Scope doctor program adjustments as review notes on submitted weekly check-ins.
  - Alternatives considered: Structured program versioning would support richer auditing, but the requested scope is review notes only. The proposal therefore stores adjustment summaries and review timestamps against the relevant check-in.
- Decision: Keep weekly reminders and review follow-up notifications on the existing queued job pattern.
  - Alternatives considered: Inline delivery would conflict with the current notification architecture and existing background-automation specs.

## Risks / Trade-offs
- Reusing `check_ins` for two related workflows keeps the schema smaller, but it means implementation will need careful validation rules and query scopes so weekly progress entries never decrement package credits.
- The patient dashboard will expose engagement alerts as derived state rather than a persistent inbox, so it will show actionable and recent workflow status, not a full immutable notification history.
- The docs imply a single active package view, but the current schema allows multiple active packages. The proposal therefore keeps package selection explicit for weekly check-ins and progress history instead of assuming only one active entitlement exists.
- Meal-plan visibility depends on the consultation-to-package linkage already created during package activation, so implementation must preserve that linkage consistently for doctor and patient views.

## Migration Plan
1. Extend the `check_ins` schema and query layer first so weekly progress, review metadata, and current operational check-ins can coexist safely.
2. Expand the patient workspace next, because it depends on the new check-in shape plus existing package and consultation relationships.
3. Add the doctor active-program review flow after the shared data model exists.
4. Add weekly reminder and review-follow-up jobs last, then verify the full patient-doctor loop with feature tests.

## Open Questions
- None for proposal scope. The unresolved source-document gaps around `user_health_data`, persistent notifications, and structured program revisions are intentionally deferred by this change.
