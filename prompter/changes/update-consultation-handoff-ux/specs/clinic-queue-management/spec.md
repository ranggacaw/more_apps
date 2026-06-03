## MODIFIED Requirements
### Requirement: Doctor Queue Patient View
The system SHALL show each verified doctor their currently assigned walk-in patient (the most recent entry in `assigned` or `in_consultation` status for that doctor) on the doctor dashboard, displaying the patient name, queue number, complaint notes, and assignment time. The system SHALL provide a Start Consultation action for `assigned` entries that starts the consultation and immediately redirects the doctor to the in-room consultation workspace, and SHALL provide an Open in-room workspace action for already-started `in_consultation` entries.

#### Scenario: Doctor has an assigned walk-in patient
- **WHEN** a verified doctor opens their dashboard and has a queue entry in `assigned` status
- **THEN** the system shows the patient details (name, queue number, complaint notes, assigned time) with a Start Consultation action

#### Scenario: Doctor starts consultation with assigned patient
- **WHEN** a verified doctor clicks Start Consultation on their assigned queue entry
- **THEN** the system sets the entry status to `in_consultation`, records `consultation_started_at`, and redirects the doctor to the in-room consultation workspace for that queue entry

#### Scenario: Doctor resumes started walk-in consultation
- **WHEN** a verified doctor opens their dashboard and has a queue entry in `in_consultation` status
- **THEN** the system shows the patient details with an Open in-room workspace action for that queue entry

#### Scenario: Doctor marks consultation as done
- **WHEN** a verified doctor completes the in-room workspace for their `in_consultation` queue entry
- **THEN** the system sets the entry status to `completed` and records `completed_at`

#### Scenario: Doctor has no assigned walk-in patient
- **WHEN** a verified doctor opens the dashboard and has no queue entry in `assigned` or `in_consultation` status
- **THEN** the system shows an empty state indicating no walk-in patient is currently assigned
