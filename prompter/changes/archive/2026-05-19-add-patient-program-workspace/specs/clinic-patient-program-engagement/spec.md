## ADDED Requirements

### Requirement: Patient Ongoing Care Workspace
The system SHALL provide each verified patient a program-engagement workspace built from existing patient profile, booking, package, consultation, and check-in records, and SHALL show the patient's current profile or health context from existing user fields, upcoming confirmed consultations, active package status, meal-plan download availability for package-linked consultations, and a derived engagement feed for current weekly touchpoints without requiring a separate persistent notifications table.

#### Scenario: Patient with an active package opens the workspace
- **WHEN** a verified patient with at least one active package opens the patient dashboard
- **THEN** the system shows the patient's current profile context, active package summaries, the next confirmed consultation if one exists, any linked meal-plan asset that is available, and engagement items derived from due or recently reviewed weekly program activity

#### Scenario: Patient without an active package opens the workspace
- **WHEN** a verified patient with no active package opens the patient dashboard
- **THEN** the system still shows booking and profile context, but presents empty states and next-step guidance for package-specific cards instead of failing the dashboard

### Requirement: Weekly Program Check-In Submission
The system SHALL allow a verified patient to submit one weekly progress check-in for a selected active package during each seven-day program week counted from that package's activation timestamp, SHALL capture weight and waist metrics plus optional notes and an optional progress photo, and SHALL store the submission against the selected active package without decrementing the package's remaining consultation credits.

#### Scenario: Patient submits the current week's check-in successfully
- **WHEN** a verified patient selects an active package and submits the first weekly check-in for that package's current program week
- **THEN** the system stores the week number, quantitative metrics, optional notes, and optional photo against that package while leaving its remaining consultation credits unchanged

#### Scenario: Duplicate or ineligible weekly submission is rejected
- **WHEN** a patient submits a second weekly check-in for the same package and program week or attempts to submit against an inactive package
- **THEN** the system rejects the submission and preserves the existing check-in and package state

### Requirement: Patient Progress Trend Visibility
The system SHALL show weekly progress history for a selected active package in chronological order using the stored check-in metrics and review state so the patient can understand how the program is progressing over time.

#### Scenario: Patient has prior weekly progress history
- **WHEN** a patient opens the progress view for an active package that already has weekly check-ins
- **THEN** the system returns the package's check-ins ordered by program week with their metrics, notes, media availability, and doctor review status for charting or timeline display

#### Scenario: Patient has no weekly progress history yet
- **WHEN** a patient opens the progress view for an active package before any weekly check-ins have been submitted
- **THEN** the system shows an empty progress state and keeps the current week's submission action available
