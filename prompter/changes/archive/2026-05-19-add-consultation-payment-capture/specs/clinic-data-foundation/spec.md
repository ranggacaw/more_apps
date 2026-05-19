## MODIFIED Requirements

### Requirement: Core Operational Schema
The system SHALL persist the clinic platform's core operational entities for users, doctors, doctor availabilities, time slots, bookings, payments, packages, user packages, check-ins, and consultations with explicit relationships that preserve booking, payment, and care-delivery history, and SHALL store consultation payment attempts with unique provider order identifiers, the approved fixed consultation charge amount, and provider payload history so each callback can be resolved to exactly one booking without ambiguity.

#### Scenario: Consultation payment resolves to one booking record
- **WHEN** a patient books a consultation and initiates payment
- **THEN** the system stores linked patient, doctor, slot, booking, and payment records with a unique Midtrans order ID and the fixed consultation amount needed to resolve the payment callback without ambiguity

#### Scenario: Consultation retry preserves payment attempt history
- **WHEN** a patient re-enters consultation checkout after a failed or expired consultation payment attempt
- **THEN** the system records a distinct payment attempt with a new unique Midtrans order ID while preserving the prior attempt history against the same booking

#### Scenario: Completed consultation references recommended package
- **WHEN** a doctor completes a consultation with notes and a recommended package
- **THEN** the system stores the consultation against the booking, patient, doctor, and selected package without duplicating those identities in unrelated tables
