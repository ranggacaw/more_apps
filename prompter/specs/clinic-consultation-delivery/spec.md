# clinic-consultation-delivery Specification

## Purpose
TBD - created by archiving change add-doctor-consultation-completion. Update Purpose after archive.
## Requirements
### Requirement: Doctor Consultation Workload View
The system SHALL show each verified doctor a compact dashboard overview of that doctor's current confirmed consultation workload, prioritizing same-day appointments and surfacing the patient identity, scheduled time, readiness status, and summary counts needed to choose the next action quickly, and SHALL provide drill-in actions from that overview into focused consultation or review workspaces instead of rendering every operational form inline on the dashboard.

#### Scenario: Doctor opens the current consultation workload overview
- **WHEN** a verified doctor opens the doctor dashboard
- **THEN** the system returns only that doctor's relevant confirmed consultations in schedule order together with concise summary context and direct links into the appropriate focused workflow for each item

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

