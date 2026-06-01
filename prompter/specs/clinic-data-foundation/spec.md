# clinic-data-foundation Specification

## Purpose
TBD - created by archiving change add-dependable-platform-services. Update Purpose after archive.
## Requirements
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

### Requirement: Slot Lock Lifecycle Data
The system SHALL record slot availability, temporary locks, lock ownership, and lock expiry timestamps so a slot can move between available, locked, booked, and released states without orphaning related bookings or payments.

#### Scenario: Slot is locked for checkout
- **WHEN** a patient selects an available consultation slot
- **THEN** the slot record stores the locking user and expiry timestamp needed to protect checkout for up to 15 minutes

#### Scenario: Expired lock returns slot to inventory
- **WHEN** a pending booking passes its lock-expiry time before payment confirmation
- **THEN** the system can cancel or fail the pending booking and payment records while restoring the slot to an available state

### Requirement: Weekly Program Check-In Records
The system SHALL store weekly patient progress check-ins against user packages with a package-scoped program week number derived from the package activation timestamp, weight and waist metrics, optional patient notes, an optional progress photo asset path, and doctor-review metadata including reviewer identity, review notes, and reviewed timestamp, while preserving the existing operational check-in records used for package-consumption tracking.

#### Scenario: Weekly progress submission is stored without consuming package credit
- **WHEN** a patient submits a weekly program check-in for an active package
- **THEN** the system stores the progress entry against that package with its current program week and leaves the package's remaining consultation-credit counters unchanged

#### Scenario: Doctor review metadata is stored on the weekly check-in
- **WHEN** the responsible doctor reviews a submitted weekly check-in
- **THEN** the system stores the doctor reviewer, review notes, and reviewed timestamp on that same weekly progress record

#### Scenario: Operational package check-ins remain valid
- **WHEN** an admin or clinician records an operational package check-in tied to a booking or consultation
- **THEN** the system can still store remaining-consultation tracking and related booking or consultation links without requiring weekly progress fields

### Requirement: Admin-Assisted Booking Records
The system SHALL persist admin-assisted booking data without requiring every booking to have a registered patient user, including booking source, booked-by admin identity, consultation mode, optional registered patient link, guest patient name, required guest WhatsApp number for guest bookings, and meeting-link request timestamps for online bookings. Guest consultation records SHALL preserve patient identity and contact from the booking without creating a login account.

#### Scenario: Admin-assisted registered patient booking is stored
- **WHEN** a verified admin confirms a booking for an existing patient account
- **THEN** the booking stores the patient user link, booked-by admin identity, admin-assisted source, selected consultation mode, and slot relationship needed for doctor delivery

#### Scenario: Admin-assisted guest booking is stored
- **WHEN** a verified admin confirms a booking for a non-registered patient
- **THEN** the booking stores guest patient name and WhatsApp contact without creating a `users` record
- **AND** the booking remains linked to the selected doctor and slot for operational delivery

#### Scenario: Online admin-assisted booking tracks meeting-link request state
- **WHEN** an admin confirms an online admin-assisted booking without a meeting link
- **THEN** the booking stores that a doctor-hosted meeting link has been requested and can later record when the doctor submits the link

### Requirement: Aesthetic Program And Package Option Master Data
The system SHALL persist admin-managed Aesthetic Program master data with program name, integer IDR selling price, integer IDR HPP/COGS, active state, timestamps, and deletion state where needed to preserve historical references. The system SHALL persist consultation package-option master data for selectable slimming trial/package/add-on options with program family, option type, name, selling price, injection frequency, duration label or days, active state, add-on eligibility rules, and sort order. Historical consultation line items SHALL retain name and price snapshots when master records change or become inactive.

#### Scenario: Master data stores financial values as IDR integers
- **WHEN** an admin saves an aesthetic program or consultation package option
- **THEN** the system stores price and HPP/COGS values as integer Indonesian Rupiah amounts consistent with existing payment storage

#### Scenario: Historical consultation retains snapshots
- **WHEN** a selected aesthetic program or package option is later renamed, repriced, deactivated, or deleted where allowed
- **THEN** existing consultation line items keep the original submitted name, price, dosage, and option metadata snapshots

### Requirement: Consultation Treatment Line Item Data
The system SHALL persist consultation treatment line items separately from the parent consultation so each completed consultation can store multiple aesthetic programs, one primary slimming package option, optional add-ons, manual treatment details where supported by the UI, quantity, dosage value, dosage unit defaulting to `ml`, notes, selling-price snapshot, HPP snapshot when available to admin/finance, attending doctor identity through the consultation, and creation/update timestamps.

#### Scenario: Consultation stores multiple line items
- **WHEN** a doctor completes a consultation with multiple aesthetic program selections and one selected package option
- **THEN** the system stores each selection as a distinct line item linked to the single consultation record

#### Scenario: Dosage unit is omitted
- **WHEN** a submitted line item has a dosage value but no dosage unit
- **THEN** the system stores `ml` as the dosage unit for that line item

### Requirement: Consultation-Originated Billing Payment Data
The system SHALL persist consultation-originated billing handoff records in `payments` using a distinct internal payment type/provider, a unique internal order identifier, pending status by default, booking and consultation linkage, total integer IDR amount, total HPP amount where available, payload snapshots of selected billing line items, and nullable user linkage where the source booking is a guest booking. These records SHALL NOT be treated as Midtrans checkout attempts.

#### Scenario: Registered consultation creates billing payment
- **WHEN** a completed registered-patient consultation has chargeable treatment line items
- **THEN** the system stores a pending internal payment linked to the user, booking, consultation, and selected line-item snapshots

#### Scenario: Guest consultation creates billing payment
- **WHEN** a completed guest consultation has chargeable treatment line items
- **THEN** the system stores a pending internal payment linked to the booking and consultation with no user account requirement
- **AND** display identity can still be resolved from the booking guest fields

#### Scenario: Internal payment is excluded from provider callbacks
- **WHEN** Midtrans sends a callback for provider-backed payment processing
- **THEN** consultation-originated internal payment records are not processed as Midtrans payments and are not mutated by unrelated callback payloads

### Requirement: Clinic Hours And Override Data
The system SHALL persist clinic operating-hour settings and schedule override audits in database tables rather than hardcoded constants. Operating-hour settings SHALL support day-of-week, start time, end time, active state, and timestamps. Schedule override audit records SHALL store admin identity, doctor identity, affected date/time or slot, optional booking identity, reason, and timestamps.

#### Scenario: Default clinic hours are seeded
- **WHEN** the clinic schedule seed runs
- **THEN** weekday operating-hour records exist for 16:00 to 20:00 and weekend operating-hour records exist for 10:00 to 20:00

#### Scenario: Admin override is audited
- **WHEN** an admin creates or confirms a booking outside configured clinic hours through an override flow
- **THEN** the system stores the override reason, admin, doctor, affected time, and related booking or slot reference for later audit

### Requirement: Finance Statement Data Model
The system SHALL persist simplified finance statement inputs without requiring an inventory or POS transaction model, including zero-default return and HPP amounts on payment records, operating expense records, and manual balance-sheet entries. Monetary finance values SHALL use the same integer IDR storage convention as existing payment amounts.

#### Scenario: Existing payments receive finance defaults
- **WHEN** the finance statement migration is applied to existing payment records
- **THEN** each payment has return and HPP fields available with zero defaults
- **AND** existing payment, booking, and package checkout history remains valid

#### Scenario: Operating expense input is stored for reporting
- **WHEN** a valid operating expense is saved
- **THEN** the system stores its name, optional category, integer amount, expense date, optional notes, timestamps, and deletion state needed for P&L reporting

#### Scenario: Manual balance-sheet input is stored for reporting
- **WHEN** a valid balance-sheet entry is saved
- **THEN** the system stores its side, label, optional category, integer amount, entry date, optional notes, and timestamps needed for as-of balance-sheet reporting

#### Scenario: Inventory data is not required for finance-first reports
- **WHEN** the finance statement reports are calculated before inventory management exists
- **THEN** the system uses payment HPP values and manual entries rather than requiring product, stock movement, or sale-line tables

