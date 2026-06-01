# clinic-package-commerce Specification

## Purpose
TBD - created by archiving change add-wellness-package-credit-checkout. Update Purpose after archive.
## Requirements
### Requirement: Credit-Aware Package Catalog
The system SHALL let a verified patient browse the active wellness package catalog through a concise, decision-first page that explains the patient's current consultation credit state in plain language, presents active packages in a scannable comparison format with the original price, applied credit amount, final payable amount, included consultation credits, and checkout eligibility, and keeps any in-progress package checkout visible as supporting context so package selection remains the primary task.

#### Scenario: Eligible patient opens the package catalog
- **WHEN** a verified patient has a positive, unexpired consultation credit linked to a completed consultation
- **THEN** the system returns each active package with its original price, applied credit amount, final payable amount, included consultation credits, and an eligible checkout state in a layout that makes the next package decision clear

#### Scenario: Patient opens the package catalog with unavailable credit
- **WHEN** a verified patient has no consultation credit or only an expired or already-consumed credit
- **THEN** the system still returns the active package catalog with zero applied credit, a plain-language explanation of why checkout is unavailable, and a layout that avoids burying package choices under redundant instructional content

#### Scenario: Patient has an in-progress package checkout
- **WHEN** a verified patient already has a pending package checkout
- **THEN** the system keeps that checkout's payment state and continue action visible without replacing the core package-comparison view or implying that multiple concurrent checkouts are allowed

### Requirement: Credit-Protected Package Checkout
The system SHALL only let a verified patient start package checkout when the selected package is active, the patient has a positive unexpired consultation credit, the credit's source consultation is completed, and that credit has not already funded another package purchase.

#### Scenario: Ineligible package checkout is rejected
- **WHEN** a patient attempts to start package checkout with missing, expired, consumed, or not-yet-qualified consultation credit
- **THEN** the system rejects the checkout attempt and does not create a package payment or activate an entitlement

#### Scenario: Funded package checkout starts with a discounted balance
- **WHEN** an eligible patient selects an active package whose price exceeds the available consultation credit
- **THEN** the system creates or reuses a pending package payment attempt for the final payable amount after the valid credit deduction

### Requirement: Zero-Balance Package Activation
The system SHALL immediately activate the selected package without Midtrans when the patient's valid consultation credit fully covers the package price, and SHALL record the purchase outcome so credit consumption and package activation remain auditable.

#### Scenario: Consultation credit covers the full package price
- **WHEN** an eligible patient selects an active package whose price is less than or equal to the available consultation credit
- **THEN** the system consumes the consultation credit, records the package purchase as completed, activates the patient entitlement, and returns a completed checkout result without issuing a Midtrans session

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

