## ADDED Requirements
### Requirement: Booked Appointment Arrival Check-In
The system SHALL let verified admins check in same-day confirmed in-clinic consultation bookings only when the patient arrives, and SHALL create exactly one booking-linked `clinic_queue_entries` record with the booking source, booking reference, assigned doctor, resolved patient identity, queue date, daily queue sequence, human-readable queue number, `waiting` status, and check-in timestamp. The system SHALL NOT assign a queue number when the booking is originally created or confirmed.

#### Scenario: Admin checks in today's confirmed booking
- **WHEN** a verified admin checks in a confirmed offline booking scheduled for the current clinic day
- **THEN** the system creates a booking-linked queue entry for that booking with the next daily queue number
- **AND** the queue entry uses the booking's doctor and resolved registered or guest patient identity

#### Scenario: Booking is not eligible for arrival check-in
- **WHEN** a verified admin attempts to check in a booking that is not confirmed, is not scheduled for the current clinic day, is already completed, is already marked no-show, is online-only, or already has a queue entry
- **THEN** the system rejects the check-in and does not allocate a queue number

#### Scenario: Booking confirmation does not allocate a queue number
- **WHEN** an admin or payment callback confirms a booking for a future date
- **THEN** the booking remains without a queue entry and without a queue number until same-day check-in succeeds

### Requirement: Booking No-Show Handling
The system SHALL let verified admins mark same-day confirmed in-clinic bookings as no-show before the patient has checked in. A no-show booking SHALL NOT receive a queue number, SHALL be excluded from active queue lists, and SHALL NOT be completable through doctor consultation workflows.

#### Scenario: Admin marks a not-arrived booking no-show
- **WHEN** a verified admin marks a same-day confirmed in-clinic booking as no-show before check-in
- **THEN** the system updates the booking to a no-show state without creating a queue entry
- **AND** the booking disappears from the not-arrived and active queue sections

#### Scenario: Admin cannot mark a checked-in booking no-show
- **WHEN** a booking already has an active queue entry
- **THEN** the system rejects no-show marking and requires the queue entry to be cancelled or completed through queue controls instead

## MODIFIED Requirements
### Requirement: Walk-In Queue Entry Management
The system SHALL let verified admins add walk-in patients to the digital clinic queue by capturing the patient name (required), phone number (optional), complaint notes (optional), and optional doctor assignment, and SHALL assign a daily auto-incrementing queue number to each entry using the same transactional allocator used by booking arrival check-in. Walk-in entries SHALL be stored as `clinic_queue_entries` records with `walk_in` source, no booking reference, `waiting` status, queue date, daily sequence, human-readable queue number, and `queued_at` timestamp.

#### Scenario: Admin adds a walk-in patient to the queue
- **WHEN** a verified admin submits a new walk-in queue entry with a patient name
- **THEN** the system creates a `clinic_queue_entries` record with `walk_in` source, status `waiting`, the next daily queue number, and the current timestamp as `queued_at`

#### Scenario: Admin adds a patient without optional fields
- **WHEN** a verified admin submits a walk-in queue entry with only the patient name
- **THEN** the system creates the entry with phone, complaint notes, and doctor assignment left empty and still assigns a queue number

#### Scenario: Concurrent queue entries request numbers
- **WHEN** two admins check in bookings or add walk-ins at the same time for the same queue date
- **THEN** the system allocates unique daily queue sequences and rejects duplicate sequence persistence at the database level

#### Scenario: Admin cancels a waiting queue entry
- **WHEN** a verified admin cancels a queue entry that is in `waiting` or `assigned` status
- **THEN** the system sets the status to `cancelled` and records `cancelled_at`

### Requirement: Queue-to-Doctor Assignment
The system SHALL let verified admins assign `waiting` walk-in queue entries to a specific active doctor, SHALL record the assignment timestamp without changing the daily queue order, and SHALL NOT allow assignment of entries that are already in consultation, completed, cancelled, or linked to a scheduled booking whose doctor is inherited from the booking.

#### Scenario: Admin assigns a waiting walk-in patient to a doctor
- **WHEN** a verified admin assigns a `waiting` walk-in queue entry to an active doctor
- **THEN** the system sets `doctor_id` and records `assigned_at` while preserving the entry's queue number and waiting order

#### Scenario: Admin cannot assign a non-waiting patient
- **WHEN** a verified admin attempts to assign a queue entry that is not in `waiting` status
- **THEN** the system rejects the assignment and the entry remains unchanged

#### Scenario: Admin cannot reassign a booking-linked patient through queue controls
- **WHEN** a verified admin attempts to assign a booking-linked queue entry to a different doctor
- **THEN** the system rejects the assignment and keeps the doctor inherited from the booking

### Requirement: Doctor Queue Patient View
The system SHALL show each verified doctor the doctor's current in-clinic queue state, including any called or in-consultation patient and the next `waiting` patient assigned to or inherited by that doctor in daily queue order. The view SHALL display queue number, source type, patient identity, contact details when present, complaint or intake notes, assignment/check-in timestamps, and SHALL provide Call Patient, Start Consultation, or Open Workspace actions according to the queue entry status and source.

#### Scenario: Doctor has a checked-in booking next in queue
- **WHEN** a verified doctor opens the doctor dashboard or queue API and has a booking-linked `waiting` entry with the lowest queue sequence for that doctor
- **THEN** the system shows that entry as the next patient with queue number, booking source, patient identity, and a Call Patient action

#### Scenario: Doctor calls the next patient
- **WHEN** the assigned doctor calls a `waiting` queue entry that belongs to that doctor
- **THEN** the system changes the entry to `assigned`, records the called timestamp, and keeps the entry visible as the current called patient

#### Scenario: Doctor starts consultation for a called patient
- **WHEN** the assigned doctor starts an `assigned` queue entry
- **THEN** the system sets the entry status to `in_consultation`, records `consultation_started_at`, and redirects the doctor to the correct consultation workspace for the entry source

#### Scenario: Doctor has no queue patient
- **WHEN** a verified doctor has no `waiting`, `assigned`, or `in_consultation` queue entries for the current queue date
- **THEN** the system shows an empty state indicating no in-clinic patient is currently queued for that doctor

### Requirement: Admin Live Queue View
The system SHALL provide verified admins with a live queue management page at `/admin/queue` that polls for updates every 5 seconds, showing today's not-yet-arrived confirmed in-clinic bookings, active queue entries from both booking and walk-in sources grouped by status, active doctors with their current patient status, and providing add walk-in, booking check-in, no-show, doctor assignment, and cancel actions where eligible.

#### Scenario: Admin views the live arrival queue
- **WHEN** a verified admin opens `/admin/queue`
- **THEN** the system shows today's confirmed in-clinic bookings without queue numbers in a not-arrived section
- **AND** shows active `waiting`, `assigned`, and `in_consultation` queue entries from both sources sorted by daily queue order

#### Scenario: Admin queue view updates when doctor completes a consultation
- **WHEN** a doctor marks a booking-linked or walk-in queue entry as `completed` and the admin queue page polls for updates
- **THEN** the completed entry is removed from the active queue and related summary counts update within 5 seconds

#### Scenario: Admin sees doctor availability status
- **WHEN** a verified admin views the queue page
- **THEN** the system shows each active doctor's current status, including the current patient name and queue number when assigned or in consultation

#### Scenario: Admin sees daily queue summary
- **WHEN** a verified admin views the queue page
- **THEN** the system shows counts for total same-day bookings, not arrived bookings, checked-in patients, active queue patients, completed consultations, and no-show bookings

### Requirement: Queue-Originated In-Room Consultation Workspace
The system SHALL allow a verified doctor to open the appropriate in-room consultation workspace after a queue entry has been started. Walk-in queue entries SHALL use the queue-originated consultation workspace and billing handoff rules. Booking-linked queue entries SHALL use the scheduled booking consultation workspace, preserve booking identity/payment context, include queue number context, and mark the queue entry completed only when the booking consultation completion succeeds.

#### Scenario: Doctor opens workspace for active walk-in patient
- **WHEN** a verified doctor has a walk-in queue entry assigned to them in `in_consultation` status
- **THEN** the system provides an action to open the in-room consultation workspace for that queue entry
- **AND** the workspace shows the walk-in patient identity and complaint notes as source context

#### Scenario: Doctor opens workspace for active booking-linked patient
- **WHEN** a verified doctor has a booking-linked queue entry assigned to them in `in_consultation` status
- **THEN** the system opens the scheduled booking consultation workspace for the linked booking
- **AND** the workspace shows queue number, arrival timestamp, booking identity, and available intake context

#### Scenario: Doctor completes workspace for active walk-in patient
- **WHEN** the assigned doctor submits the walk-in in-room workspace with notes, Slimming Monitoring Form metrics, selected slimming options, selected aesthetic programs, or manual treatment lines
- **THEN** the system stores the queue-originated consultation data and marks the queue entry as `completed`

#### Scenario: Doctor completes workspace for active booking-linked patient
- **WHEN** the assigned doctor submits completion details for a booking-linked queue entry in `in_consultation` status
- **THEN** the system stores the booking consultation data with queue traceability and marks both the booking and queue entry as `completed`

#### Scenario: Unassigned doctor cannot open queue workspace
- **WHEN** a doctor who is not assigned to or inherited by the queue entry attempts to open or complete the in-room workspace
- **THEN** the system denies access and leaves the booking, queue entry, consultation, and billing records unchanged
