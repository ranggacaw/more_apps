# clinic-consultation-delivery Specification

## Purpose
TBD - created by archiving change add-doctor-consultation-completion. Update Purpose after archive.
## Requirements
### Requirement: Doctor Consultation Workload View
The system SHALL show each verified doctor a compact dashboard overview of that doctor's current confirmed consultation workload, prioritizing same-day appointments and surfacing the patient identity, scheduled time, readiness status, and summary counts needed to choose the next action quickly, and SHALL provide drill-in actions from that overview into focused consultation or review workspaces instead of rendering every operational form inline on the dashboard. The system SHALL also display the currently assigned walk-in queue patient (if any) in a dedicated panel on the dashboard with patient details and "Start Consultation" / "Done" actions as defined in `clinic-queue-management`.

#### Scenario: Doctor opens the current consultation workload overview
- **WHEN** a verified doctor opens the doctor dashboard
- **THEN** the system returns only that doctor's relevant confirmed consultations in schedule order together with concise summary context and direct links into the appropriate focused workflow for each item
- **AND** the system shows the doctor's currently assigned walk-in queue patient in a separate panel if one exists

#### Scenario: Unpaid or unrelated bookings are excluded from the completion workload
- **WHEN** a booking belongs to another doctor or is still pending payment confirmation
- **THEN** the system does not expose that booking as a completable consultation in the doctor's workload view

#### Scenario: Doctor has no current confirmed consultations
- **WHEN** a verified doctor opens the dashboard without any current confirmed consultations waiting for work
- **THEN** the system shows an empty overview state without leaving unused completion forms expanded on the dashboard

### Requirement: Booking Intake Context Review
The system SHALL let the assigned doctor open a focused consultation workspace for a confirmed booking to review the available pre-consultation intake context before completion, using the patient's submitted booking notes and uploaded document when present while keeping unrelated dashboard content out of the same working surface.

#### Scenario: Booking includes pre-consultation context
- **WHEN** a confirmed consultation booking contains patient notes or an uploaded intake document and the assigned doctor opens that booking's focused workspace
- **THEN** the system shows that available context alongside the completion workflow for the assigned doctor

#### Scenario: Booking has no stored intake context
- **WHEN** a confirmed consultation booking has neither patient notes nor an uploaded intake document and the assigned doctor opens that booking's focused workspace
- **THEN** the system keeps the completion workflow available while indicating that no intake context was provided

### Requirement: Consultation Completion Capture
The system SHALL let the assigned doctor complete a confirmed booking by recording consultation notes and optionally selecting one recommended package, SHALL persist at most one consultation record per booking, and SHALL transition the booking to `completed` only after the consultation record is stored successfully.

#### Scenario: Doctor completes a consultation with a package recommendation
- **WHEN** the assigned doctor submits completion details for a confirmed booking with notes and a selected recommended package
- **THEN** the system stores or updates the single consultation record for that booking, links it to the booking, patient, doctor, and recommended package, and marks the booking as `completed`

#### Scenario: Doctor completes a consultation without a package recommendation
- **WHEN** the assigned doctor submits completion details for a confirmed booking without selecting a package
- **THEN** the system stores the consultation notes, leaves the recommended package reference empty, and still marks the booking as `completed`

#### Scenario: Doctor cannot complete another doctor's or a non-confirmed booking
- **WHEN** a doctor attempts to complete a booking that is assigned to a different doctor or is not in `confirmed` status
- **THEN** the system rejects the completion attempt and leaves the booking and consultation records unchanged

### Requirement: Doctor-Hosted Online Meeting Link Capture
The system SHALL require online admin-assisted consultations to have a doctor-supplied HTTPS Google Meet URL before the scheduled start, SHALL surface missing-link state in the assigned doctor's workload and focused consultation workspace, and SHALL allow only the assigned doctor to save or update that link. Online admin-assisted consultations SHALL NOT be completable while the required meeting link is missing.

#### Scenario: Doctor sees an online booking that needs a link
- **WHEN** an assigned doctor opens the dashboard, consultation workload, or focused workspace for an online admin-assisted booking without a meeting link
- **THEN** the system shows that a Google Meet link is required before the consultation time

#### Scenario: Assigned doctor saves a valid Google Meet link
- **WHEN** the assigned doctor submits a valid HTTPS Google Meet URL for their confirmed online booking
- **THEN** the system stores the meeting link, records the submitted timestamp, and makes the link visible in doctor and patient-facing consultation contexts

#### Scenario: Invalid meeting link is rejected
- **WHEN** the assigned doctor submits a non-Google-Meet URL or an invalid URL for an online admin-assisted booking
- **THEN** the system rejects the update and keeps the previous meeting-link state unchanged

#### Scenario: Unrelated doctor cannot update the link
- **WHEN** a doctor who is not assigned to the booking attempts to save or update the Google Meet link
- **THEN** the system denies the request and leaves the booking unchanged

#### Scenario: Online booking cannot be completed without required link
- **WHEN** the assigned doctor attempts to complete an online admin-assisted consultation before saving the required Google Meet link
- **THEN** the system rejects completion and keeps the booking confirmed

