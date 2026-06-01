## ADDED Requirements
### Requirement: Consultation-Originated Billing Handoff
The system SHALL create a pending internal payment record when a completed consultation includes one or more chargeable consultation line items from selected slimming package options, Diamond add-ons, aesthetic programs, or supported manual treatment entries. The payment amount SHALL equal the sum of chargeable line-item totals, SHALL use Indonesian Rupiah integer storage, SHALL be linked to the booking and consultation, and SHALL use a distinct internal type/provider so it is not treated as a Midtrans checkout.

#### Scenario: Consultation completion creates pending internal payment
- **WHEN** the assigned doctor completes a consultation with chargeable selected package or aesthetic program line items
- **THEN** the system creates a pending internal payment record for the summed line-item selling price total
- **AND** the payment is linked to the booking and consultation for billing and finance traceability

#### Scenario: Consultation completion has no chargeable line items
- **WHEN** the assigned doctor completes a consultation with notes only and no chargeable package, add-on, aesthetic program, or manual treatment line items
- **THEN** the system does not create a consultation-originated payment record

#### Scenario: Internal billing payment does not trigger package entitlement
- **WHEN** a consultation-originated internal payment is created from a selected package option
- **THEN** the system does not immediately activate a `user_packages` entitlement, consume consultation credit, or award new consultation credit

#### Scenario: Internal billing payment is visible for authorized follow-up
- **WHEN** an authorized billing or finance user reviews payment records after consultation completion
- **THEN** the system can identify the pending internal consultation-originated payment, its source consultation, selected line-item snapshots, total amount, and HPP amount where available without exposing HPP to doctors
