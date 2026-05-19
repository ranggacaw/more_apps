## ADDED Requirements

### Requirement: Core Operational Schema
The system SHALL persist the clinic platform's core operational entities for users, doctors, doctor availabilities, time slots, bookings, payments, packages, user packages, check-ins, and consultations with explicit relationships that preserve booking, payment, and care-delivery history.

#### Scenario: Consultation payment resolves to one booking record
- **WHEN** a patient books a consultation and initiates payment
- **THEN** the system stores linked patient, doctor, slot, booking, and payment records that can be resolved from the payment callback without ambiguity

#### Scenario: Completed consultation references recommended package
- **WHEN** a doctor completes a consultation with notes and a recommended package
- **THEN** the system stores the consultation against the booking, patient, doctor, and selected package without duplicating those identities in unrelated tables

### Requirement: Package Entitlement Tracking
The system SHALL store package catalog data separately from patient-owned package entitlements so activation state, consultation-credit deductions, and package usage can be audited over time.

#### Scenario: Package purchase activates a patient entitlement
- **WHEN** a patient successfully pays for a recommended package
- **THEN** the system creates or updates a user-package entitlement record without mutating the package catalog definition

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
