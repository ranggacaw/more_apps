## MODIFIED Requirements
### Requirement: Consultation Completion Capture
The system SHALL let the assigned doctor complete a confirmed booking by recording consultation notes or Slimming Monitoring Form details, and selecting a package to assign. The system SHALL persist at most one consultation record per booking, generate an internal billing invoice for the selected package, and SHALL transition the booking to `completed` only after the consultation record and invoice are stored successfully.

#### Scenario: Doctor completes a Slimming Program consultation with a package assignment
- **WHEN** the assigned doctor submits completion details for a confirmed booking with Slimming Monitoring Form metrics (Weight, BMI, etc.) and assigns a package
- **THEN** the system stores the consultation record with the metrics, links it to the booking, patient, doctor, and assigned package, generates a pending internal payment (invoice), and marks the booking as `completed`

#### Scenario: Doctor completes a general consultation with a package assignment
- **WHEN** the assigned doctor submits completion details for a confirmed general booking with notes and assigns a package
- **THEN** the system stores the consultation notes, generates a pending internal payment (invoice) for the assigned package, and marks the booking as `completed`

#### Scenario: Doctor cannot complete another doctor's or a non-confirmed booking
- **WHEN** a doctor attempts to complete a booking that is assigned to a different doctor or is not in `confirmed` status
- **THEN** the system rejects the completion attempt and leaves the booking and consultation records unchanged
