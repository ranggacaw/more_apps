## Context
The app is Laravel 12 with Inertia React. Doctor consultation completion currently stores a single `consultations` row per booking with notes, optional meal-plan PDF, and an optional `recommended_package_id`. Package commerce is patient-initiated through `payments` and `user_packages`; admin-assisted bookings bypass Midtrans and can include registered or guest patients. Finance reporting already reads paid `payments`, return amounts, and HPP amounts, but there is no invoice module.

The requested feature spans doctor care delivery, admin master data, scheduling, and billing. The user clarified that billing handoff should create a payment record and dosage editing should stay doctor-only.

## Goals / Non-Goals
- Goals: capture treatment-level dosage and pricing in the consultation workspace, expose fixed slimming package/trial choices, let admins manage aesthetic program master data, create pending internal payment records on consultation completion, and enforce configurable clinic hours with admin override audit.
- Non-Goals: build a separate invoice module, add payment settlement UI, add a medical staff role, integrate inventory/POS, or automatically activate patient package entitlements from consultation-room selections.

## Decisions
- Decision: Use consultation line items as the canonical bridge between medical documentation and billing.
- Rationale: A consultation can include multiple aesthetic programs and optional add-ons, while the existing `consultations.recommended_package_id` supports only one package reference.
- Consequence: Add a `consultation_line_items`-style table with item type, selected master-data references, snapshot names, quantities, dosage value/unit, unit price, HPP snapshot where applicable, notes, and timestamps.

- Decision: Store slimming trial/package options in database-backed option records seeded with the requested pricing.
- Rationale: The options are selectable business data, not purely UI copy, and the selected values must be snapshotted into consultation and billing records.
- Consequence: Add a package-option catalog with Basic, Advanced, and Diamond primary options plus the Diamond oral medication add-on; allow inactive options to disappear from new selection while preserving historical line-item snapshots.

- Decision: Use the existing `payments` table for billing handoff with a new internal consultation-treatment payment type.
- Rationale: The user requested payment record creation and the app already has finance/payment reporting around `payments`; a separate invoice module is out of scope.
- Consequence: Completed consultations with chargeable line items create a pending `payments` row using provider `internal`, a unique internal order id, total amount, total HPP where available, booking and consultation links, and no Midtrans snap token. Guest bookings require nullable payment user linkage while retaining the booking relationship for identity.

- Decision: Keep doctor UI free of HPP/COGS while preserving admin and finance data.
- Rationale: Doctors need clinical and selling-price context, while HPP/COGS is admin-only data.
- Consequence: Controller payloads for doctor search/selection expose program id, name, and price only; line-item persistence may store HPP snapshots server-side for reporting.

- Decision: Enforce clinic hours as configurable global operating windows layered over doctor availability.
- Rationale: The current system lets doctors define recurring availability, but the request requires clinic-wide hours that are manageable from admin settings and not hardcoded.
- Consequence: Seed default hours of Monday-Friday 16:00-20:00 and Saturday-Sunday 10:00-20:00, filter/generated slots to the intersection of doctor availability and clinic hours, reject patient booking outside hours with the required message, and allow admin overrides only with audit records.

## Risks / Trade-offs
- Internal payment records could be confused with Midtrans payment attempts. Mitigation: use a distinct payment type and provider, no snap token, and webhook logic that only processes provider-backed order ids.
- Guest billing requires payment records without a registered user. Mitigation: require the booking link for guest-originated internal payments and derive display identity from the booking.
- Line-item snapshots can drift from master data after price changes. Mitigation: intentionally snapshot names, prices, HPP, dosage, and option metadata at completion time for auditability.
- Admin schedule overrides can bypass clinic-hour safety. Mitigation: require override reason, admin identity, timestamp, doctor, date/time, and affected booking/slot in the audit log.

## Migration Plan
1. Add schema for aesthetic programs, package option catalog, consultation line items, clinic operating hours, schedule override logs, and payment links needed for consultation-originated internal payments.
2. Seed default clinic hours and requested slimming package options idempotently.
3. Backfill nothing for historical consultations; old consultations remain valid without line items or internal billing payments.
4. Update code paths to read new data only after migrations exist.
5. Rollback by removing newly introduced tables/columns and leaving historical consultation/payment records untouched where foreign-key constraints require preservation.

## Open Questions
- Payment collection and mark-paid behavior for consultation-originated internal payments is intentionally deferred; this proposal only creates the pending payment/billing handoff.
