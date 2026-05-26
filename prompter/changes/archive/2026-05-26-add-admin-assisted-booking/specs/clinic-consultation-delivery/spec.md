## ADDED Requirements
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
