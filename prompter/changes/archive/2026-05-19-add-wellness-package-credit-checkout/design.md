## Context
The current platform supports consultation checkout, authoritative Midtrans consultation webhooks, doctor-side consultation completion, and package entitlement activation. EPIC-005 adds the missing commercial bridge between those flows: a patient should be able to apply the paid consultation fee as a single-use credit toward a wellness package after the qualifying consultation is completed.

## Goals / Non-Goals
- Goals:
- Award a single-use consultation credit when a consultation payment succeeds.
- Let patients browse active packages with original price, applied credit, and final payable amount.
- Enforce that package credit can only be used when it is positive, unexpired, tied to a completed consultation, and not already consumed.
- Support both funded package checkout through Midtrans and immediate activation when the remaining balance is zero.
- Keep package activation and patient notifications auditable through existing payment and entitlement records.
- Non-Goals:
- Stacked or partially consumed consultation credits.
- Coupon, bundle, or loyalty-program stacking.
- Subscription renewals or recurring billing.
- Offline package payment reconciliation.

## Decisions
- Decision: Zero-balance package purchases will bypass Midtrans and activate immediately.
  Why: Midtrans is only needed when funds still need to be collected. Creating a `Rp 0` external payment session adds failure modes without collecting revenue.
  Alternatives considered: Always send zero-balance checkouts through Midtrans, or reject zero-balance purchases entirely.
- Decision: The MVP will keep one outstanding consultation-credit state on the patient record, plus source-payment linkage for auditability.
  Why: The source material already points to `users.consultation_credit`, and a single active credit matches the epic's single-use assumption while keeping the first implementation small.
  Alternatives considered: A dedicated consultation-credit ledger with multiple concurrent credits.
- Decision: Package checkout eligibility will require both valid credit state and a completed qualifying consultation linked to that credit's source payment.
  Why: Credit award alone is not enough because the epic requires the consultation to be completed before package purchase can proceed.
  Alternatives considered: Allow package checkout immediately after payment success, or require the selected package to exactly match the doctor's recommendation.
- Decision: Package purchases will reuse the existing `payments` table with a payment-type discriminator and optional package reference.
  Why: The existing webhook, order ID, and payload-history mechanisms already solve the same payment-audit problem for consultation checkout.
  Alternatives considered: A separate package-payments table.

## Risks / Trade-offs
- Single-record credit state will not support multiple overlapping consultation credits. This is acceptable for the MVP and should be called out explicitly in specs.
- Immediate zero-balance activation introduces a non-webhook success path. This is mitigated by performing credit consumption and entitlement creation inside one transaction and reusing the same activation notification flow.
- Package eligibility depends on linking the awarded credit back to a qualifying consultation payment and booking. Missing linkage would weaken auditability, so the schema delta should make that association explicit.

## Migration Plan
1. Add user-level consultation-credit fields and payment fields needed to distinguish consultation versus package purchases and to record applied credit.
2. Backfill existing rows with safe defaults so current consultation checkout and package entitlements continue to behave as they do today.
3. Add patient package browsing and checkout behavior, then extend webhook and activation handling for package purchases.
4. Add feature coverage for both funded and zero-balance package flows before shipping.

## Open Questions
- None. This proposal uses the recommended MVP rule that zero-balance package purchases activate immediately without Midtrans.
