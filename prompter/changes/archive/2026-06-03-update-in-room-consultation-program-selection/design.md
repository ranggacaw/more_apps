## Context
The current in-room doctor workflow is implemented by the booking-based doctor consultation workspace. It already loads active slimming package options, active aesthetic programs, dosage inputs, manual treatment lines, and creates consultation line items plus pending internal billing records on completion.

Walk-in queue entries are separate records with patient identity, assigned doctor, status timestamps, and dashboard start/done actions. They do not currently create a consultation record, expose the program-selection workspace, or participate in treatment billing handoff.

## Goals / Non-Goals
- Goals: reuse the existing consultation workspace as the in-room page for scheduled and walk-in patients.
- Goals: let assigned doctors select aesthetic programs or slimming package options after the patient enters the room.
- Goals: preserve existing billing, HPP hiding, dosage warning, and active-only selection rules.
- Non-Goals: create a separate anesthesia module or a new master-data catalog.
- Non-Goals: add patient self-service screens or patient login behavior.
- Non-Goals: change admin aesthetic program management or slimming option seed values.

## Decisions
- Decision: keep `Doctor/ConsultationWorkspace.jsx` as the primary UI and make it source-aware rather than building a second page.
- Rationale: the existing workspace already contains the required fields and validation affordances, so source-awareness is smaller and less risky than duplicating the workflow.

- Decision: model walk-in queue completion as a queue-originated consultation source instead of forcing the queue through normal scheduled appointment behavior.
- Rationale: walk-ins are operational queue events, not booked slots. Linking consultation records to queue entries avoids synthetic future slots while still preserving source traceability.

- Decision: keep chargeable line-item billing as pending internal payment handoffs and link them to the source consultation, plus the booking or queue entry where applicable.
- Rationale: finance already excludes pending handoffs from paid revenue and expects treatment payload snapshots; walk-ins need the same traceable billing behavior.

## Risks / Trade-offs
- Risk: shared completion logic can become harder to read if booking and queue concerns are mixed inline.
- Mitigation: extract only the source-specific authorization and payload mapping needed for reuse; keep line-item construction behavior unchanged.

- Risk: queue-originated consultations may have no registered patient account.
- Mitigation: continue using nullable patient links and store/display guest identity from the queue entry for doctor and billing contexts.

## Migration Plan
- Add queue-source linkage for consultations and any payment traceability fields needed by billing views.
- Backfill is not required because existing queue entries did not previously create in-room consultation records.
- Existing scheduled consultation records and payments remain unchanged.

## Open Questions
- None for this proposal. The requested page is the current consultation workspace, and the scope includes both scheduled and walk-in flows.
