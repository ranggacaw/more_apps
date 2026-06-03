## ADDED Requirements
### Requirement: Queue-Originated In-Room Consultation Workspace
The system SHALL allow a verified doctor to open an in-room consultation workspace for the doctor's active walk-in queue entry after the entry has been started. The workspace SHALL reuse the same aesthetic program selection, slimming program/package selection, dosage capture, notes, and treatment billing handoff rules used by scheduled doctor consultations.

#### Scenario: Doctor opens workspace for active walk-in patient
- **WHEN** a verified doctor has a walk-in queue entry assigned to them in `in_consultation` status
- **THEN** the system provides an action to open the in-room consultation workspace for that queue entry
- **AND** the workspace shows the walk-in patient identity and complaint notes as source context

#### Scenario: Doctor completes workspace for active walk-in patient
- **WHEN** the assigned doctor submits the walk-in in-room workspace with notes, Slimming Monitoring Form metrics, selected slimming options, selected aesthetic programs, or manual treatment lines
- **THEN** the system stores the queue-originated consultation data and marks the queue entry as `completed`

#### Scenario: Unassigned doctor cannot open walk-in workspace
- **WHEN** a doctor who is not assigned to the queue entry attempts to open or complete the walk-in in-room workspace
- **THEN** the system denies access and leaves the queue entry unchanged

## MODIFIED Requirements
### Requirement: Doctor Queue Patient View
The system SHALL show each verified doctor their currently assigned walk-in patient (the most recent entry in `assigned` or `in_consultation` status for that doctor) on the doctor dashboard, displaying the patient name, queue number, complaint notes, and assignment time. The dashboard SHALL provide a Start Consultation action for `assigned` entries and an Open in-room workspace action for `in_consultation` entries so the doctor completes the visit through the consultation workspace before the queue entry is marked completed.

#### Scenario: Doctor has an assigned walk-in patient
- **WHEN** a verified doctor opens their dashboard and has a queue entry in `assigned` status
- **THEN** the system shows the patient details (name, queue number, complaint notes, assigned time) with a Start Consultation action

#### Scenario: Doctor starts consultation with assigned patient
- **WHEN** a verified doctor clicks Start Consultation on their assigned queue entry
- **THEN** the system sets the entry status to `in_consultation`, records `consultation_started_at`, and makes an Open in-room workspace action available for that entry

#### Scenario: Doctor opens active walk-in workspace
- **WHEN** a verified doctor opens their dashboard and has a queue entry in `in_consultation` status
- **THEN** the system shows the patient details with an Open in-room workspace action instead of treating the queue as complete without consultation capture

#### Scenario: Doctor completes walk-in through workspace
- **WHEN** the assigned doctor completes the in-room consultation workspace for the queue entry
- **THEN** the system sets the entry status to `completed` and records `completed_at`

#### Scenario: Doctor has no assigned walk-in patient
- **WHEN** a verified doctor opens their dashboard and has no queue entry in `assigned` or `in_consultation` status
- **THEN** the system shows an empty state indicating no walk-in patient is currently assigned
