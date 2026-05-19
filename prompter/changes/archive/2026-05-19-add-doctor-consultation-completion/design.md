## Context
The codebase already includes the core consultation entities, a doctor dashboard route, and a controller action that can mark a confirmed booking as completed. That implementation is narrower than EPIC-004: doctors do not get an explicit completion form in the dashboard, the doctor-visible context is not specified in the current specs, and there is no documented post-completion patient notification flow.

## Goals / Non-Goals
- Goals:
- Define the doctor-facing workflow for reviewing current confirmed consultations and completing a session consistently.
- Reuse the existing booking intake data as the doctor-visible pre-consultation context.
- Ensure consultation completion persists structured output and triggers the next patient step through queued notifications.
- Non-Goals:
- Introduce a new `screenings` schema or standalone screening-management feature.
- Define package payment, entitlement activation, or weekly program management behavior.
- Expand the doctor dashboard into the broader patient-list, check-in review, or program-adjustment scope mentioned elsewhere in the source docs.

## Decisions
- Decision: Use existing booking intake data as screening context.
  Why: The current app already stores `bookings.notes` and `bookings.patient_upload_path`, while a dedicated `screenings` model is not built or specified. This keeps the proposal aligned with present implementation reality.

- Decision: Scope the workflow to doctor-owned confirmed bookings and persist one consultation per booking.
  Why: The existing code and schema already model a unique consultation per booking and a `confirmed` to `completed` transition. The proposal should formalize that behavior rather than invent a multi-record encounter model.

- Decision: Reuse the existing queued outbound-notification path for post-consultation follow-up.
  Why: Payment confirmations, reminders, OTP delivery, and package activation already rely on queued delivery through provider-oriented services. Consultation completion should follow the same pattern.

## Alternatives Considered
- Add a new `screenings` capability now.
  Rejected because the epic itself notes the missing schema, and introducing a new intake domain would broaden the change beyond the requested consultation-completion workflow.

- Keep the current one-click completion action and document it as sufficient.
  Rejected because EPIC-004 explicitly requires doctor review of available context plus entry of notes and an optional recommendation before completion.

## Risks / Trade-offs
- Booking notes and uploaded documents are a narrower substitute for a full screening record.
  Mitigation: Make that assumption explicit in the proposal so a later dedicated screening change can extend the doctor workflow without conflicting with this scope.

- Reusing an existing booking notification job for post-completion follow-up may couple two different message types.
  Mitigation: Leave room for implementation to either extend the current job safely or introduce a focused follow-up job while preserving the same queued provider flow.

## Migration Plan
1. Add the new consultation-delivery capability and update the related existing specs.
2. Implement doctor dashboard/query changes and the consultation completion form.
3. Extend queued notifications for the completion handoff.
4. Validate behavior with feature tests before approval for release.

## Open Questions
- None. This proposal assumes booking notes and patient uploads are the approved intake context for EPIC-004.
