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
The system SHALL let the assigned doctor complete a confirmed booking by recording consultation notes, optional meal-plan summary, doctor-only treatment line items, optional selected slimming trial/package details, optional selected aesthetic program line items, and optionally one legacy recommended package reference. The system SHALL persist at most one consultation record per booking, SHALL persist submitted treatment/package/program line items against that consultation with dosage details and pricing snapshots, SHALL create a pending internal payment record when chargeable line items are submitted, and SHALL transition the booking to `completed` only after the consultation, line items, and required billing handoff are stored successfully.

#### Scenario: Doctor completes a consultation with a package recommendation
- **WHEN** the assigned doctor submits completion details for a confirmed booking with notes and a selected recommended package
- **THEN** the system stores or updates the single consultation record for that booking, links it to the booking, patient when available, doctor, and recommended package, and marks the booking as `completed`

#### Scenario: Doctor completes a consultation without a package recommendation
- **WHEN** the assigned doctor submits completion details for a confirmed booking without selecting a recommended package or billable treatment items
- **THEN** the system stores the consultation notes, leaves the recommended package reference empty, does not create a consultation-originated payment, and still marks the booking as `completed`

#### Scenario: Doctor completes a consultation with chargeable treatment selections
- **WHEN** the assigned doctor submits completion details with one selected slimming package option, an allowed Diamond add-on, or one or more aesthetic program treatment line items
- **THEN** the system stores the consultation, stores each submitted line item with its dosage, quantity, selected master-data reference when applicable, price snapshot, and attending doctor linkage, creates a pending internal payment record for the total chargeable amount, and marks the booking as `completed`

#### Scenario: Doctor cannot complete another doctor's or a non-confirmed booking
- **WHEN** a doctor attempts to complete a booking that is assigned to a different doctor or is not in `confirmed` status
- **THEN** the system rejects the completion attempt and leaves the booking, consultation, line-item, and payment records unchanged

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

### Requirement: Doctor Treatment Dosage Capture
The system SHALL let only the assigned doctor record treatment line items during consultation completion with treatment name or selected program/package name, quantity, optional notes, dosage value, and dosage unit. Dosage unit SHALL default to `ml` when no other unit is provided. Empty dosage SHALL produce a warning before finalization but SHALL NOT be a hard validation block.

#### Scenario: Doctor records dosage on a treatment line
- **WHEN** the assigned doctor adds a treatment line with quantity, dosage value, and dosage unit during consultation completion
- **THEN** the system stores the dosage value and dosage unit on that line item with the consultation record

#### Scenario: Dosage is empty during finalization
- **WHEN** the assigned doctor attempts to complete a consultation with one or more treatment lines whose dosage value is empty
- **THEN** the doctor-facing UI warns that dosage is missing
- **AND** the doctor can still finalize the consultation after acknowledging or continuing past the warning

#### Scenario: Non-doctor cannot edit dosage
- **WHEN** a patient, admin, super admin, or unassigned doctor attempts to create or update consultation dosage data through doctor consultation completion routes
- **THEN** the system denies the request and leaves consultation line items unchanged

### Requirement: Consultation Slimming Trial And Package Selection
The system SHALL present active slimming trial/package options in the doctor consultation workspace, including Basic Trial at Rp 700000, Basic 4-week Package at Rp 2500000, Advanced Trial at Rp 1200000, Advanced 4x Injections Package at Rp 4500000, Diamond Trial at Rp 2000000, Diamond 3x Injections Package at Rp 5500000, and Diamond Additional Oral Medication add-on at Rp 500000 per 10 days. The doctor SHALL be able to select one primary option and SHALL be able to add the oral medication add-on only when a Diamond primary option is selected. Selecting an option SHALL auto-populate package name, price, injection frequency, and duration into the consultation record and billing line items.

#### Scenario: Doctor selects a primary package option
- **WHEN** the assigned doctor selects one active primary trial or package option during consultation completion
- **THEN** the system displays and stores the option name, price, injection frequency, duration, and selected option reference as part of the consultation line items

#### Scenario: Doctor selects Diamond oral medication add-on
- **WHEN** the assigned doctor selects a Diamond primary option and enables the oral medication add-on
- **THEN** the system stores an additional add-on line item with the Rp 500000 price and 10-day duration

#### Scenario: Doctor attempts add-on without Diamond primary option
- **WHEN** the assigned doctor attempts to submit the oral medication add-on without selecting a Diamond primary option
- **THEN** the system rejects the add-on selection and does not store the add-on line item

#### Scenario: Patient has a last-used package option
- **WHEN** a registered patient has a prior completed consultation with a selected slimming package option
- **THEN** the doctor consultation workspace pre-fills that last-used primary package option while still allowing the assigned doctor to change it before completion

### Requirement: Consultation Aesthetic Program Selection
The system SHALL let the assigned doctor add multiple aesthetic program treatment line items through a searchable select input that queries active Aesthetic Program master data by program name. Selecting an aesthetic program SHALL auto-populate program name and selling price into the consultation line item while never exposing HPP/COGS values to the doctor.

#### Scenario: Doctor searches active aesthetic programs
- **WHEN** the assigned doctor searches for an aesthetic program by name in the consultation workspace
- **THEN** the system returns matching active programs with id, name, and selling price only
- **AND** the response excludes HPP/COGS values

#### Scenario: Doctor selects multiple aesthetic programs
- **WHEN** the assigned doctor selects more than one active aesthetic program during a consultation
- **THEN** the system stores one consultation line item per selected program with the selected program reference, name snapshot, selling price snapshot, and dosage fields

#### Scenario: Inactive aesthetic program is excluded
- **WHEN** an aesthetic program is inactive
- **THEN** the system excludes it from doctor-facing program search and rejects new consultation line items that reference it

