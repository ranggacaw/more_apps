# clinic-consultation-scheduling Specification

## Purpose
TBD - created by archiving change add-reliable-consultation-scheduling. Update Purpose after archive.
## Requirements
### Requirement: Active Doctor Discovery
The system SHALL expose only doctors with active consultation profiles in booking-facing doctor listings and SHALL include the public profile data needed for patient selection: doctor name, specialization, biography, consultation fee, and avatar when available.

#### Scenario: Patient opens the booking doctor directory
- **WHEN** a patient loads the consultation-booking flow
- **THEN** the system returns only active doctors and includes the profile fields needed to compare and choose a doctor

#### Scenario: Inactive doctor is excluded from discovery
- **WHEN** a doctor profile is marked inactive
- **THEN** the system omits that doctor from booking-facing doctor listings and from patient slot-discovery entry points

### Requirement: Recurring Availability Definition
The system SHALL let authenticated and verified doctors define recurring weekly availability blocks using day of week, start time, end time, and slot duration, and SHALL treat active availability blocks as the source for future consultation slot generation.

#### Scenario: Doctor saves a recurring availability block
- **WHEN** a doctor submits a valid weekly availability window with a slot duration
- **THEN** the system stores the recurring availability and generates future slots from that schedule

#### Scenario: Invalid availability window is rejected
- **WHEN** a doctor submits an availability block whose end time is not after its start time or whose slot duration falls outside the accepted range
- **THEN** the system rejects the request and leaves existing availability unchanged

### Requirement: Doctor-Date Slot Search
The system SHALL generate missing future slots for a requested active doctor and date from matching active recurring availability, and SHALL return only reservable slots for that doctor and date in chronological order. A reservable slot is one that is not booked and is not covered by another patient's still-valid lock.

#### Scenario: Patient requests slots for an active doctor and date
- **WHEN** a patient selects an active doctor and consultation date
- **THEN** the system generates any missing slots for that doctor and date and returns the reservable results ordered by start time

#### Scenario: Requested date has no matching availability
- **WHEN** a patient requests slots for a doctor and date that have no active recurring availability window
- **THEN** the system returns an empty slot collection for that doctor and date

### Requirement: Exclusive Slot Locking
The system SHALL acquire slot locks atomically for 15 minutes, bind each lock to the requesting patient, and reject lock requests for slots that are already booked or still locked by another patient.

#### Scenario: Patient locks an available slot
- **WHEN** a patient requests a lock for a reservable slot
- **THEN** the system marks the slot as locked for that patient until 15 minutes from the successful lock operation

#### Scenario: Second patient cannot take an active lock
- **WHEN** another patient attempts to lock a slot that is still within another patient's active 15-minute hold
- **THEN** the system rejects the request and keeps the existing lock ownership unchanged

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

