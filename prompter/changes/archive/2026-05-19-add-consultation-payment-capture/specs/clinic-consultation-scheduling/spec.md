## MODIFIED Requirements

### Requirement: Pending Booking Checkout Handoff
The system SHALL create or reuse a pending booking only when the selected slot is still locked by the requesting patient with a future expiry, SHALL hand the patient off to consultation checkout after a successful booking confirmation step, and SHALL only expose that checkout handoff for the patient's own eligible pending booking while final booking confirmation remains dependent on the consultation payment callback.

#### Scenario: Patient confirms a valid locked slot
- **WHEN** the locking patient confirms a selected doctor and a still-valid locked slot
- **THEN** the system creates a pending booking, or reuses that patient's existing active pending booking for the same slot, and redirects the patient to consultation checkout

#### Scenario: Patient opens checkout for an eligible pending booking
- **WHEN** the patient opens consultation checkout for their own pending booking that still belongs to the locked slot being purchased
- **THEN** the system returns the booking summary and payment handoff data needed to continue consultation checkout without confirming the booking yet

#### Scenario: Slot lock is stale or owned by another patient
- **WHEN** a patient attempts to confirm a slot without a matching active lock they own
- **THEN** the system rejects the booking request and does not create a new pending booking
