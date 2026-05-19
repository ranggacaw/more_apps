# clinic-doctor-program-review Specification

## Purpose
TBD - created by archiving change add-patient-program-workspace. Update Purpose after archive.
## Requirements
### Requirement: Doctor Active Program Patient Queue
The system SHALL provide each verified doctor a review queue of patients who currently hold active packages linked to consultations completed by that doctor, and SHALL include the patient identity, active package summary, current meal-plan availability, latest weekly check-in, and pending-review state needed to prioritize follow-up.

#### Scenario: Doctor opens the active program queue
- **WHEN** a verified doctor opens the doctor program-review view
- **THEN** the system shows only patients whose active packages are linked to that doctor's completed consultations, along with the latest package and weekly progress context needed for review

#### Scenario: Unrelated patients are excluded from the queue
- **WHEN** a patient's active package belongs to another doctor or no longer has an active package state
- **THEN** the system does not expose that patient in the signed-in doctor's active program review queue

### Requirement: Doctor Weekly Check-In Review Notes
The system SHALL let the responsible doctor review a patient's submitted weekly check-in, inspect any attached progress media, and record follow-up notes or adjustment summaries against that check-in without requiring a separate structured program-versioning subsystem.

#### Scenario: Doctor records review notes for a weekly check-in
- **WHEN** the responsible doctor opens a patient's weekly check-in and submits review notes or an adjustment summary
- **THEN** the system stores the review metadata on that check-in, preserves the original patient-submitted metrics and media, and makes the reviewed state visible to the patient workspace

#### Scenario: Doctor cannot review another doctor's patient check-in
- **WHEN** a doctor attempts to review a weekly check-in for a package that is not linked to one of that doctor's completed consultations
- **THEN** the system rejects the review attempt and leaves the weekly check-in unchanged

