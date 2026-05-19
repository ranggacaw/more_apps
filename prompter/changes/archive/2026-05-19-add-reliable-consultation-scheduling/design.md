## Context
EPIC-002 covers the consultation scheduling workflow that turns doctor availability into patient-reservable appointments. The current Laravel application already spans this behavior across `BookingController`, `SlotController`, `DoctorAvailabilityController`, `TimeSlotService`, booking-facing React pages, and scheduler-backed slot release. The proposal needs to align those moving parts under one capability without pulling payment capture, reminders, or rescheduling into scope.

## Goals / Non-Goals
- Goals:
- Define a dedicated scheduling capability that maps directly to EPIC-002.
- Preserve the existing transactional locking approach that prevents double-booking.
- Close the known behavior gaps around doctor profile exposure and active-doctor-only slot discovery.
- Non-Goals:
- Payment capture or webhook behavior beyond the checkout handoff.
- Meeting-link creation, reminder delivery, rescheduling, waitlists, or calendar exceptions.
- Solving timezone and daylight-saving policies that are not defined in the source epic.

## Decisions
- Decision: Add a new `clinic-consultation-scheduling` capability instead of expanding `clinic-mvp`.
  Rationale: `clinic-mvp` is currently an umbrella summary spec. The scheduling flow now deserves a focused capability that can hold the detailed doctor, slot, and booking rules from EPIC-002 without overloading the umbrella spec.
  Alternatives considered: Modify only `clinic-mvp`. Rejected because it would mix coarse MVP scope with workflow-level scheduling rules.
- Decision: Keep hybrid slot generation.
  Rationale: The existing code already generates slots when availability is created, when booking search requests a doctor and date, and through the `clinic:generate-slots` Artisan command. Keeping that hybrid model minimizes missed inventory while avoiding a larger scheduling subsystem.
  Alternatives considered: Scheduler-only pre-generation for all doctors and dates. Rejected because it adds broader operational complexity without a requirement that demands it.
- Decision: Keep database-backed row locking for slot reservation and booking creation.
  Rationale: `lockForUpdate()` plus the existing slot and booking status checks already match the double-booking risk in the epic. This is simpler and better aligned with the current PostgreSQL/Laravel stack than introducing Redis or a separate lock table.
  Alternatives considered: External distributed locks or a dedicated lock entity. Rejected because the current scope does not require that extra infrastructure.
- Decision: Use the existing `Doctor` profile model as the public source for booking-facing doctor discovery.
  Rationale: The data model already includes `specialization`, `bio`, `avatar_url`, `consultation_fee`, and `is_active`, so EPIC-002 can be satisfied by exposing and enforcing those fields consistently instead of inventing a new profile store.
  Alternatives considered: A new doctor-directory aggregate or asset workflow. Rejected because the epic only needs booking-facing discovery data.

## Risks / Trade-offs
- Overlapping recurring availability windows could create confusing slot inventory even though the unique `(doctor_id, start_time)` constraint blocks exact duplicates. Mitigation: keep overlapping-window policy explicit during implementation and test the current generation behavior.
- Timezone and daylight-saving behavior is still unspecified. Mitigation: keep this proposal scoped to the application's current clinic-local datetime handling and record timezone policy as a follow-up if required.
- Returning expired locked slots as reservable inventory before scheduler cleanup can be surprising if API and data-state expectations diverge. Mitigation: make reservable-slot behavior explicit in the scheduling capability and keep it aligned with the lock-release spec.

## Migration Plan
No schema migration is expected for the proposal itself. Implementation should remain compatible with the existing scheduling tables and should focus on controller, service, UI, and test updates unless approved scope expands.

## Open Questions
- Should overlapping recurring availability blocks be prevented at write time, or is the current unique-slot generation safeguard sufficient for MVP?
- Is clinic scheduling expected to use one fixed clinic timezone for all doctors and patients, or will timezone-aware booking become a later capability?
- Is `avatar_url` expected to remain an external URL field, or should doctor photos eventually move onto the clinic asset disk?
