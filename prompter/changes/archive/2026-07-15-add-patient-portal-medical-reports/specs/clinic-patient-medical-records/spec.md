## ADDED Requirements
### Requirement: Patient Portal Report Dashboard
The system SHALL provide each verified patient a portal dashboard that summarizes active package progress, next-control guidance, key progress metrics, and the latest finalized patient-visible session report without exposing any other patient's data.

#### Scenario: Patient opens portal with active program and report history
- **WHEN** a verified patient with an active package and finalized session reports opens the patient portal dashboard
- **THEN** the system shows that patient's active package progress, next-control date when available, key metric summaries, and latest finalized report summary

#### Scenario: Patient opens portal without report history
- **WHEN** a verified patient opens the patient portal before any finalized session report exists
- **THEN** the system shows an empty report state and keeps available package or booking context visible

### Requirement: Finalized Session Report Detail
The system SHALL let a verified patient view the full patient-visible detail for the patient's finalized session reports, including visit date, session number when available, package context, clinician context, physical measurements, doctor notes intended for the patient, patient instructions, next-control date, and approved attachments.

#### Scenario: Patient opens own finalized report
- **WHEN** a verified patient opens a finalized report that belongs to that patient
- **THEN** the system shows the patient-visible report fields and approved attachments for that report

#### Scenario: Patient attempts to open another patient's report
- **WHEN** a verified patient requests a finalized report that belongs to another patient
- **THEN** the system denies access and does not disclose the other patient's report metadata

### Requirement: Patient Progress Charts From Reports
The system SHALL provide patient progress trend data from finalized session reports and weekly progress check-ins for supported metrics, ordered chronologically and limited to the signed-in patient.

#### Scenario: Patient views progress trend
- **WHEN** a verified patient opens a progress view for a supported metric with finalized report or check-in history
- **THEN** the system returns only that patient's chronological metric points with enough labels for charting and comparison

#### Scenario: Patient requests unsupported metric
- **WHEN** a verified patient requests a metric that is not supported for progress trends
- **THEN** the system rejects the request or returns a safe empty state without exposing unrelated data
