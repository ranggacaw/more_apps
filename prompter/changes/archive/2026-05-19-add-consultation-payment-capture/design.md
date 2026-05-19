## Context
EPIC-003 covers the consultation payment workflow that begins after a slot is locked and a pending booking exists. The current Laravel application already spans this behavior across `PaymentController`, `MidtransService`, `MeetingLinkService`, queued booking notifications, the consultation checkout page, and the payment webhook route. Existing Prompter capabilities already describe the surrounding scheduling, data, integration, and automation boundaries, so this proposal should deepen those capabilities rather than create a parallel payment spec that repeats them.

## Goals / Non-Goals
- Goals:
- Make consultation checkout initialization explicit, including the fixed Rp 500.000 fee, unique Midtrans order IDs, and Snap token creation.
- Define that the Midtrans webhook, not the browser callback, is authoritative for final payment, booking, and slot state.
- Document successful, pending, failed, and duplicate callback behavior, including meeting-link creation and queued confirmations.
- Preserve the existing local-development demo path for consultation checkout when live Midtrans keys are unavailable.
- Non-Goals:
- Package-payment activation, consultation-credit deduction, refunds, chargebacks, or manual reconciliation workflows.
- Financial reporting, invoice generation, or subscription billing.
- Redesigning the booking flow before the patient reaches consultation checkout.

## Decisions
- Decision: Modify the existing scheduling, data, integration, and automation capabilities instead of adding a new payment capability.
  Rationale: EPIC-003 is cross-cutting, but its behavior already lives inside established capabilities. Reusing those capabilities keeps the spec set cohesive and avoids duplicating payment rules between a new payment spec and the existing Midtrans, booking, and notification specs.
  Alternatives considered: Add a new `clinic-consultation-payments` capability. Rejected because it would overlap heavily with `clinic-service-integrations`, `clinic-consultation-scheduling`, and `clinic-background-automation`.
- Decision: Keep a server-side payment attempt as the authoritative checkout artifact before webhook confirmation.
  Rationale: The current application already persists consultation payments before launching Snap. Making that explicit preserves a unique order ID, a stable amount, and a resolvable callback target even when the browser reloads or the payment remains pending.
  Alternatives considered: Generate Snap tokens without persisting a payment attempt first. Rejected because the callback would lose a durable application record to reconcile against.
- Decision: Treat the browser-side Snap callbacks as navigation and refresh signals only.
  Rationale: Midtrans webhook delivery is the source of truth in the epic and in the current domain rules. The frontend can react to `onSuccess`, `onPending`, `onError`, and `onClose`, but it must not confirm or cancel the booking directly.
  Alternatives considered: Let the frontend confirm booking state immediately after `onSuccess`. Rejected because it creates race conditions and contradicts the authoritative-callback requirement.
- Decision: Keep successful consultation confirmation atomic from the application's perspective by requiring meeting access before the booking is left in a confirmed state, while continuing to queue outbound confirmations after commit.
  Rationale: EPIC-003 expects confirmed consultations to have a meeting link plus WhatsApp and email confirmations. Generating meeting access before the confirmation transaction completes avoids a paid-but-linkless booking, while queued notifications remain retriable and non-blocking.
  Alternatives considered: Confirm the booking first and generate the meeting link later. Rejected because it increases the risk of partially fulfilled confirmed consultations.
- Decision: Normalize terminal callback handling around explicit success, pending, and failed outcomes with idempotent duplicate processing.
  Rationale: The epic explicitly calls out successful, pending, failed, denied, cancelled, and expired flows, and it highlights duplicate webhook risk. The proposal should require those status mappings and prevent duplicate side effects such as repeated notifications.
  Alternatives considered: Introduce a broader payment-state machine or separate fulfillment statuses. Rejected for MVP because the existing payment, booking, and slot statuses are sufficient once their transitions are specified clearly.

## Risks / Trade-offs
- The fixed Rp 500.000 consultation fee now becomes normative for checkout, while the existing doctor profile still stores `consultation_fee`. Mitigation: implementation should decide whether that field becomes display-only for MVP consultation checkout or whether the amount source is centralized.
- This proposal builds on capabilities that were recently introduced by `add-dependable-platform-services`, so the implementation needs to avoid re-litigating already accepted environment, queue, and provider-boundary behavior.
- If a future meeting provider becomes a real external API instead of the current generated-link approach, webhook success handling may need stronger retry or fallback semantics. Mitigation: keep the current requirement scoped to guaranteed meeting access before confirmation, not to a specific provider implementation.

## Migration Plan
Implementation should primarily update controller, service, UI, and test code. A schema change is only needed if the approved implementation cannot express the fixed-fee or unique-attempt requirements with the existing `payments` columns and migrations.

## Open Questions
- Should the fixed Rp 500.000 consultation fee eventually move into an environment-backed or configuration-backed setting once business policy changes become likely?
