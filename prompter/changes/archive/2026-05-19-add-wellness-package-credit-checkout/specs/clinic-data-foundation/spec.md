## MODIFIED Requirements
### Requirement: Core Operational Schema
The system SHALL persist the clinic platform's core operational entities for users, doctors, doctor availabilities, time slots, bookings, payments, packages, user packages, check-ins, and consultations with explicit relationships that preserve booking, payment, and care-delivery history, SHALL store patient-provided booking intake context including freeform notes and an optional uploaded document so the assigned doctor can review it before consultation completion, SHALL store consultation payment attempts with unique provider order identifiers, the approved fixed consultation charge amount, and provider payload history so each callback can be resolved to exactly one booking without ambiguity, SHALL store a single outstanding consultation-credit state on the patient record including current balance, award timestamp, expiry timestamp, and source consultation payment linkage so package-purchase eligibility can be evaluated without ambiguity, and SHALL store package payment attempts with a payment-type discriminator, optional purchased package reference, applied consultation-credit amount, and provider payload history so funded and zero-balance package purchases can be audited over time.

#### Scenario: Consultation payment resolves to one booking record
- **WHEN** a patient books a consultation and initiates payment
- **THEN** the system stores linked patient, doctor, slot, booking, and payment records with a unique Midtrans order ID and the fixed consultation amount needed to resolve the payment callback without ambiguity

#### Scenario: Consultation retry preserves payment attempt history
- **WHEN** a patient re-enters consultation checkout after a failed or expired consultation payment attempt
- **THEN** the system records a distinct payment attempt with a new unique Midtrans order ID while preserving the prior attempt history against the same booking

#### Scenario: Booking intake context is available for doctor review
- **WHEN** a patient creates a booking with notes or uploads a pre-consultation document
- **THEN** the system stores that intake context on the booking so the assigned doctor can review it during consultation completion

#### Scenario: Completed consultation references recommended package
- **WHEN** a doctor completes a consultation with notes and a recommended package
- **THEN** the system stores the consultation against the booking, patient, doctor, and selected package without duplicating those identities in unrelated tables

#### Scenario: Paid consultation awards auditable package credit
- **WHEN** a consultation payment succeeds
- **THEN** the patient record stores the awarded consultation credit state, including the fixed credit amount, its expiry window, and the source consultation payment needed to validate later package purchase eligibility

#### Scenario: Package purchase stores applied credit and selected package
- **WHEN** a patient starts or completes a package purchase with consultation credit applied
- **THEN** the payment and related records store the payment type, selected package, applied credit amount, and resulting purchase state needed to audit entitlement activation later

### Requirement: Package Entitlement Tracking
The system SHALL store package catalog data separately from patient-owned package entitlements so activation state, consultation-credit deductions, and package usage can be audited over time, and SHALL link each activated entitlement back to the funded or zero-balance package purchase that created it.

#### Scenario: Package purchase activates a patient entitlement
- **WHEN** a patient successfully completes a funded or zero-balance package purchase
- **THEN** the system creates or updates a user-package entitlement record without mutating the package catalog definition

#### Scenario: Credit-funded package purchase is consumed once
- **WHEN** a package purchase consumes a patient's valid consultation credit
- **THEN** the system clears or marks that consultation credit as consumed so it cannot be reused for another package purchase

#### Scenario: Check-in consumes an active package entitlement
- **WHEN** an admin or clinician records a check-in tied to an active patient package
- **THEN** the system stores the check-in against the patient entitlement needed to track remaining usage and visit history
