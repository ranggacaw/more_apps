## Context
The completed in-room consultation workflow already stores scheduled and walk-in consultation records, treatment line-item snapshots, and pending internal `consultation_treatment` payments. However, operational users cannot follow the data path easily after completion. Doctors see walk-in records as unknown patients because the medical-record archive ignores `queue_entry` identity, and admins see recent pending payments without a dedicated on-site payment finalization action.

## Goals / Non-Goals
- Goals: remove the dashboard double-click by redirecting from Start Consultation to the in-room workspace.
- Goals: make aesthetic treatment entry read like a treatment billing line with Treatment Name, quantity, and price from active master data.
- Goals: show completed consultation context, treatment line items, and payment status in doctor medical records for registered, guest booking, and walk-in patients.
- Goals: let verified admins mark pending internal consultation-treatment handoffs as paid after on-site collection.
- Non-Goals: add Midtrans checkout for internal treatment handoffs.
- Non-Goals: create patient self-service payment screens or patient login behavior.
- Non-Goals: introduce inventory, stock deduction, FIFO costing, or full accounting.

## Decisions
- Decision: reuse existing source relationships instead of adding patient accounts for walk-ins.
- Rationale: walk-in identity already exists on `clinic_queue_entries`, and guest booking identity already exists on `bookings`; creating users would conflict with the project rule that clinic staff manage patient-facing workflows.

- Decision: mark on-site treatment handoffs paid through an admin-only internal payment action.
- Rationale: these records are provider `internal`, have no Midtrans snap session, and are already intended as billing handoffs. Admin confirmation keeps revenue cash-basis by changing `status` and `paid_at` only after collection.

- Decision: keep price doctor-visible and HPP doctor-hidden.
- Rationale: doctors need the selling price for patient-facing treatment selection, while HPP/COGS remains admin/finance-only according to existing aesthetic-program rules.

## Risks / Trade-offs
- Risk: admins could mark a treatment payment paid without recording method-specific details.
- Mitigation: keep the first implementation minimal with finalized-by and finalized-at audit payload fields; add explicit cash/card/transfer methods only if requested.

- Risk: medical-record detail pages can become too dense if every metric and line item is shown at once.
- Mitigation: group consultation notes, measurements, treatment line items, and payment summary into separate compact sections.

- Risk: overlapping completed change `update-in-room-consultation-program-selection` has not been archived.
- Mitigation: use current code as implementation baseline and reconcile the overlapping walk-in workspace spec deltas when archiving.

## Migration Plan
- No data backfill is required for consultation records or payments because source links already exist.
- Existing walk-in records with `queue_entry_id` should resolve patient display identity from the linked queue entry.
- Existing pending `consultation_treatment` payments become eligible for admin paid finalization when they are provider `internal` and status `pending`.

## Open Questions
- None blocking. This proposal assumes on-site payment finalization only records paid status, paid timestamp, and admin audit metadata; payment method capture can be added in a later change if needed.
