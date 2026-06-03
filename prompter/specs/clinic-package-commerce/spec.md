# clinic-package-commerce Specification

## Purpose
TBD - created by archiving change add-wellness-package-credit-checkout. Update Purpose after archive.
## Requirements
### Requirement: Consultation-Originated Billing Handoff
The system SHALL create a pending internal payment record when a completed scheduled or walk-in consultation includes one or more chargeable consultation line items from selected slimming package options, Diamond add-ons, aesthetic programs, or supported manual treatment entries. The payment amount SHALL equal the sum of chargeable line-item totals, SHALL use Indonesian Rupiah integer storage, SHALL be linked to the source consultation and the booking or queue entry where applicable, and SHALL use a distinct internal type/provider so it is not treated as a Midtrans checkout.

#### Scenario: Consultation completion creates pending internal payment
- **WHEN** the assigned doctor completes a scheduled or walk-in consultation with chargeable selected package or aesthetic program line items
- **THEN** the system creates a pending internal payment record for the summed line-item selling price total
- **AND** the payment is linked to the source consultation and the booking or queue entry where applicable for billing and finance traceability

#### Scenario: Consultation completion has no chargeable line items
- **WHEN** the assigned doctor completes a consultation with notes only and no chargeable package, add-on, aesthetic program, or manual treatment line items
- **THEN** the system does not create a consultation-originated payment record

#### Scenario: Internal billing payment does not trigger package entitlement
- **WHEN** a consultation-originated internal payment is created from a selected package option
- **THEN** the system does not immediately activate a `user_packages` entitlement, consume consultation credit, or award new consultation credit

#### Scenario: Internal billing payment is visible for authorized follow-up
- **WHEN** an authorized billing or finance user reviews payment records after consultation completion
- **THEN** the system can identify the pending internal consultation-originated payment, its source consultation, selected line-item snapshots, total amount, HPP amount where available, and source patient identity without exposing HPP to doctors

### Requirement: Admin Package Invoice Finalization
The system SHALL allow verified admin users to finalize pending internal package invoices by marking the payment as paid and activating the related patient package entitlement with consultation credits.

#### Scenario: Admin finalizes a pending package invoice
- **WHEN** a verified admin finalizes a pending internal payment of type `package`
- **THEN** the system marks the payment as paid
- **AND** the system activates a `user_packages` entitlement with the appropriate consultation credits
- **AND** the system links the `user_package_id` back to the consultation

#### Scenario: Non-admin cannot finalize package invoices
- **WHEN** a non-admin user attempts to finalize a package invoice
- **THEN** the system denies access

### Requirement: Admin Consultation Treatment Payment Finalization
The system SHALL allow verified admin users to finalize pending internal consultation-treatment payments by marking the payment as paid after on-site collection. Finalization SHALL set `status` to `paid`, set `paid_at`, preserve consultation, booking, queue, line-item, amount, and HPP snapshots, and record admin audit metadata in the payment payload without creating Midtrans sessions or package entitlements.

#### Scenario: Admin marks an internal treatment payment paid
- **WHEN** a verified admin finalizes a pending payment with type `consultation_treatment` and provider `internal`
- **THEN** the system marks the payment as paid, records the paid timestamp, and stores the finalizing admin and timestamp in the payment payload
- **AND** finance revenue includes the payment only after it is paid

#### Scenario: Admin cannot finalize ineligible payment
- **WHEN** a verified admin attempts to finalize a payment that is not pending, is not type `consultation_treatment`, or is not provider `internal`
- **THEN** the system rejects the request and leaves the payment unchanged

#### Scenario: Treatment payment finalization does not activate package credits
- **WHEN** an internal consultation-treatment payment is finalized as paid
- **THEN** the system does not activate `user_packages`, consume consultation credits, award consultation credits, or call Midtrans

