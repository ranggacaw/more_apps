## ADDED Requirements

### Requirement: Walk-In Queue Entry Management
The system SHALL let verified admins add walk-in patients to a digital queue by capturing the patient name (required), phone number (optional), and complaint notes (optional), and SHALL assign a daily auto-incrementing queue number to each entry so that patients can be identified by a short human-readable code.

#### Scenario: Admin adds a walk-in patient to the queue
- **WHEN** a verified admin submits a new queue entry with a patient name
- **THEN** the system creates a `clinic_queue_entries` record with status `waiting`, a daily queue number, and the current timestamp as `queued_at`

#### Scenario: Admin adds a patient without optional fields
- **WHEN** a verified admin submits a queue entry with only the patient name
- **THEN** the system creates the entry with phone and complaint notes left empty and still assigns a queue number

#### Scenario: Admin cancels a waiting queue entry
- **WHEN** a verified admin cancels a queue entry that is in `waiting` or `assigned` status
- **THEN** the system sets the status to `cancelled` and records `cancelled_at`

### Requirement: Queue-to-Doctor Assignment
The system SHALL let verified admins assign a `waiting` queue entry to a specific active doctor, SHALL set the entry status to `assigned` and record the assignment timestamp, and SHALL NOT allow assignment of entries that are already assigned, in consultation, or completed.

#### Scenario: Admin assigns a waiting patient to a doctor
- **WHEN** a verified admin assigns a `waiting` queue entry to an active doctor
- **THEN** the system sets `doctor_id`, status to `assigned`, and `assigned_at` to the current timestamp

#### Scenario: Admin cannot assign an already-assigned patient
- **WHEN** a verified admin attempts to assign a queue entry that is not in `waiting` status
- **THEN** the system rejects the assignment and the entry remains unchanged

### Requirement: Doctor Queue Patient View
The system SHALL show each verified doctor their currently assigned walk-in patient (the most recent entry in `assigned` or `in_consultation` status for that doctor) on the doctor dashboard, displaying the patient name, queue number, complaint notes, and assignment time, and SHALL provide a "Start" action to begin consultation and a "Done" action to signal completion.

#### Scenario: Doctor has an assigned walk-in patient
- **WHEN** a verified doctor opens their dashboard and has a queue entry in `assigned` status
- **THEN** the system shows the patient details (name, queue number, complaint notes, assigned time) with a "Start Consultation" action

#### Scenario: Doctor starts consultation with assigned patient
- **WHEN** a verified doctor clicks "Start Consultation" on their assigned queue entry
- **THEN** the system sets the entry status to `in_consultation` and records `consultation_started_at`

#### Scenario: Doctor marks consultation as done
- **WHEN** a verified doctor clicks "Done" on their `in_consultation` queue entry
- **THEN** the system sets the entry status to `completed` and records `completed_at`

#### Scenario: Doctor has no assigned walk-in patient
- **WHEN** a verified doctor opens their dashboard and has no queue entry in `assigned` or `in_consultation` status
- **THEN** the system shows an empty state indicating no walk-in patient is currently assigned

### Requirement: Admin Live Queue View
The system SHALL provide verified admins with a live queue management page at `/admin/queue` that polls for updates every 5 seconds, showing all non-completed queue entries grouped by status, active doctors with their current patient status, and providing add, assign, and cancel actions.

#### Scenario: Admin views the live queue
- **WHEN** a verified admin opens `/admin/queue`
- **THEN** the system shows all `waiting`, `assigned`, and `in_consultation` entries with patient details, queue number, assigned doctor name, and timestamps, grouped and sorted by status and queue order

#### Scenario: Admin queue view updates when doctor completes a consultation
- **WHEN** a doctor marks a queue entry as `completed` and the admin queue page polls for updates
- **THEN** the completed entry is removed from the active queue and the assigned doctor appears as available for the next assignment within 5 seconds

#### Scenario: Admin sees doctor availability status
- **WHEN** a verified admin views the queue page
- **THEN** the system shows each active doctor's current status (available, with patient name if assigned) alongside the queue entries
