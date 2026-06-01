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

### Requirement: Shared Clinic Operating Schedule
The system SHALL use active clinic operating hours as the source for future consultation slot generation for every active doctor. The default operating schedule SHALL be Monday through Friday from 16:00 to 20:00 and Saturday through Sunday from 10:00 to 20:00. Doctors SHALL NOT define individual recurring availability blocks for normal patient or admin slot discovery.

#### Scenario: Shared schedule generates slots
- **WHEN** a patient or admin searches for slots for an active doctor on a day with active clinic operating hours
- **THEN** the system generates missing future slots for that doctor within the shared clinic operating windows

#### Scenario: No active clinic hours returns no generated slots
- **WHEN** a patient or standard admin slot search targets a day without active clinic operating hours
- **THEN** the system does not generate appointment slots for that doctor and date

### Requirement: Doctor-Date Slot Search
The system SHALL generate missing future slots for a requested active doctor and date from active clinic operating hours, and SHALL return only reservable slots for that doctor and date in chronological order. A reservable slot is one that is not booked and is not covered by another patient's still-valid lock.

#### Scenario: Patient requests slots for an active doctor and date
- **WHEN** a patient selects an active doctor and consultation date
- **THEN** the system generates any missing slots for that doctor and date and returns the reservable results ordered by start time

#### Scenario: Requested date has no active clinic hours
- **WHEN** a patient requests slots for a doctor and date that have no active clinic operating window
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

### Requirement: Admin-Assisted Slot Locking
The system SHALL let verified admins search active doctors and reservable slots, then place exclusive 15-minute slot locks on behalf of registered patients or guest patients. Guest locking SHALL require a WhatsApp number, and admin-held locks SHALL prevent other patients or admins from reserving the same slot until the lock expires or is confirmed.

#### Scenario: Admin locks a slot for a registered patient
- **WHEN** a verified admin selects an active doctor, a future reservable slot, and a registered patient
- **THEN** the system locks the slot for 15 minutes under the admin-assisted workflow
- **AND** the slot is unavailable to other booking flows while the lock is active

#### Scenario: Admin locks a slot for a guest patient
- **WHEN** a verified admin selects an active doctor, a future reservable slot, a guest patient name, and a WhatsApp number
- **THEN** the system locks the slot for 15 minutes without requiring a patient account

#### Scenario: Guest lock without WhatsApp is rejected
- **WHEN** a verified admin attempts to lock or hold a slot for a guest patient without a WhatsApp number
- **THEN** the system rejects the request and leaves the slot reservable

### Requirement: Admin-Assisted Immediate Booking Confirmation
The system SHALL let verified admins convert an admin-held slot lock into a confirmed booking for a registered or guest patient, SHALL support `offline` and `online` consultation modes, SHALL mark the selected slot as booked immediately, and SHALL bypass patient checkout and Midtrans payment creation for admin-assisted confirmations. Patient self-service bookings SHALL continue to use the existing pending booking checkout handoff and Midtrans callback confirmation rules.

#### Scenario: Admin confirms an offline clinic booking
- **WHEN** a verified admin confirms an admin-held slot for offline consultation
- **THEN** the system creates a confirmed booking, marks the slot booked, records the offline consultation mode, and does not create a Midtrans checkout payment

#### Scenario: Admin confirms an online guest booking
- **WHEN** a verified admin confirms an admin-held slot for an online guest consultation with guest WhatsApp contact
- **THEN** the system creates a confirmed booking, marks the slot booked, records guest contact details, and marks the booking as needing a doctor-hosted meeting link

#### Scenario: Patient self-service checkout remains payment-authoritative
- **WHEN** a patient uses the existing public booking flow
- **THEN** the booking remains pending until the consultation payment callback confirms it under the existing checkout rules

### Requirement: Configurable Clinic Operating Hours
The system SHALL enforce clinic operating hours from admin-managed settings in addition to doctor availability. By default, appointments SHALL be available Monday through Friday from 16:00 to 20:00 and Saturday through Sunday from 10:00 to 20:00. Patient-facing and standard admin slot search SHALL display only reservable slots that fall within both the selected doctor's active availability and the clinic's active operating hours for the selected day.

#### Scenario: Patient selects a weekday date
- **WHEN** a patient selects a Monday through Friday date during booking
- **THEN** the system returns only reservable slots inside 16:00 to 20:00 and inside the selected doctor's active availability

#### Scenario: Patient selects a weekend date
- **WHEN** a patient selects a Saturday or Sunday date during booking
- **THEN** the system returns only reservable slots inside 10:00 to 20:00 and inside the selected doctor's active availability

#### Scenario: Admin updates clinic operating hours
- **WHEN** an admin updates an active clinic operating-hour setting from the admin settings panel
- **THEN** subsequent slot generation and slot search use the updated setting without requiring code changes

### Requirement: Outside-Hours Booking Rejection
The system SHALL reject patient slot locking, patient booking confirmation, and standard admin booking confirmation when the selected slot is outside configured clinic operating hours. The rejection message SHALL be `Appointments are only available during clinic hours.`

#### Scenario: Patient locks an outside-hours slot
- **WHEN** a patient attempts to lock a slot outside configured clinic operating hours
- **THEN** the system rejects the lock request with `Appointments are only available during clinic hours.`
- **AND** the slot remains available or unchanged

#### Scenario: Patient confirms an outside-hours slot
- **WHEN** a patient attempts to confirm a booking for a slot outside configured clinic operating hours
- **THEN** the system rejects the booking request with `Appointments are only available during clinic hours.`
- **AND** no pending booking or checkout handoff is created for that slot

### Requirement: Admin Schedule Override Audit
The system SHALL let verified admins override clinic operating hours only through an explicit override action that captures an override reason and stores an audit record. Overrides SHALL allow the admin to create or confirm an appointment outside clinic hours without changing the recurring clinic-hour settings for other users.

#### Scenario: Admin confirms an outside-hours appointment with override
- **WHEN** a verified admin selects an outside-hours slot or time, supplies a valid override reason, and confirms the booking
- **THEN** the system creates or confirms the booking, records the schedule override audit entry, and keeps normal clinic-hour settings unchanged

#### Scenario: Admin attempts override without reason
- **WHEN** a verified admin attempts to override clinic hours without an override reason
- **THEN** the system rejects the override and leaves booking and slot records unchanged

#### Scenario: Patient cannot override clinic hours
- **WHEN** a patient attempts to book outside configured clinic hours
- **THEN** the system denies the request rather than exposing an override path

