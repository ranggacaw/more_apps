## MODIFIED Requirements
### Requirement: Consultation Completion Capture
The system SHALL let the assigned doctor complete an in-room consultation from either a confirmed scheduled booking or the doctor's active walk-in queue patient by recording consultation notes or Slimming Monitoring Form details, and selecting package or treatment options to assign. The system SHALL persist at most one consultation record per source, generate internal billing handoffs for selected chargeable items, and SHALL transition the scheduled booking or walk-in queue entry to completed only after the consultation record and required billing records are stored successfully.

#### Scenario: Doctor completes a Slimming Program consultation with a package assignment
- **WHEN** the assigned doctor submits completion details for a confirmed scheduled booking with Slimming Monitoring Form metrics and assigns a package
- **THEN** the system stores the consultation record with the metrics, links it to the booking, patient, doctor, and assigned package, generates a pending internal payment invoice, and marks the booking as `completed`

#### Scenario: Doctor completes a general consultation with a package assignment
- **WHEN** the assigned doctor submits completion details for a confirmed scheduled general booking with notes and assigns a package
- **THEN** the system stores the consultation notes, generates a pending internal payment invoice for the assigned package, and marks the booking as `completed`

#### Scenario: Doctor completes a walk-in in-room consultation
- **WHEN** the assigned doctor submits completion details for their `in_consultation` walk-in queue entry with notes, Slimming Monitoring Form metrics, selected slimming options, or selected aesthetic programs
- **THEN** the system stores one queue-originated consultation record, stores selected treatment line items, creates pending internal treatment billing when chargeable line items exist, and marks the queue entry as `completed`

#### Scenario: Doctor cannot complete another doctor's or a non-active consultation source
- **WHEN** a doctor attempts to complete a scheduled booking assigned to a different doctor, a booking that is not `confirmed`, a walk-in queue entry assigned to a different doctor, or a queue entry that is not `in_consultation`
- **THEN** the system rejects the completion attempt and leaves booking, queue, consultation, and billing records unchanged

### Requirement: Consultation Slimming Trial And Package Selection
The system SHALL present active slimming trial/package options in the in-room doctor consultation workspace for scheduled bookings and walk-in queue consultations, including Basic Trial at Rp 700000, Basic 4-week Package at Rp 2500000, Advanced Trial at Rp 1200000, Advanced 4x Injections Package at Rp 4500000, Diamond Trial at Rp 2000000, Diamond 3x Injections Package at Rp 5500000, and Diamond Additional Oral Medication add-on at Rp 500000 per 10 days. The doctor SHALL be able to select one primary option and SHALL be able to add the oral medication add-on only when a Diamond primary option is selected. Selecting an option SHALL auto-populate package name, price, injection frequency, and duration into the consultation record and billing line items.

#### Scenario: Doctor selects a primary package option
- **WHEN** the assigned doctor selects one active primary trial or package option during scheduled or walk-in in-room consultation completion
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
The system SHALL let the assigned doctor add multiple aesthetic program treatment line items through a searchable select input in the in-room doctor consultation workspace for scheduled bookings and walk-in queue consultations. The input SHALL query active Aesthetic Program master data by program name. Selecting an aesthetic program SHALL auto-populate program name and selling price into the consultation line item while never exposing HPP/COGS values to the doctor.

#### Scenario: Doctor searches active aesthetic programs
- **WHEN** the assigned doctor searches for an aesthetic program by name in the scheduled or walk-in in-room consultation workspace
- **THEN** the system returns matching active programs with id, name, and selling price only
- **AND** the response excludes HPP/COGS values

#### Scenario: Doctor selects multiple aesthetic programs
- **WHEN** the assigned doctor selects more than one active aesthetic program during a scheduled or walk-in consultation
- **THEN** the system stores one consultation line item per selected program with the selected program reference, name snapshot, selling price snapshot, and dosage fields

#### Scenario: Inactive aesthetic program is excluded
- **WHEN** an aesthetic program is inactive
- **THEN** the system excludes it from doctor-facing program search and rejects new consultation line items that reference it
