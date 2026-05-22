## ADDED Requirements
### Requirement: Patient Medical Records Archive
The system SHALL provide each verified patient a dedicated medical-records archive derived from that patient's existing clinic data, and SHALL surface completed consultation records and weekly program records in a normalized patient-facing view that includes record category, title, summary context, occurred-at date, clinician or source context, and any patient-visible status needed to browse the history safely.

#### Scenario: Patient opens an archive with existing consultation and program history
- **WHEN** a verified patient opens the medical-records page and that patient has completed consultations or weekly program check-ins
- **THEN** the system shows only that patient's eligible records in reverse-chronological order with enough context to distinguish consultation notes, weekly progress entries, and related clinical history

#### Scenario: Patient opens an archive with no records yet
- **WHEN** a verified patient opens the medical-records page before any completed consultation or weekly program history exists
- **THEN** the system shows an empty state with guidance instead of failing or showing unrelated data

### Requirement: Patient Record Search And Filter Controls
The system SHALL let a verified patient narrow the medical-records archive by free-text search, supported record categories, and a record date window so the patient can quickly locate relevant notes or documents without browsing the full history manually.

#### Scenario: Patient filters the archive to a matching subset
- **WHEN** a verified patient searches by record title or clinician name and applies one or more supported category or date filters
- **THEN** the system returns only that patient's records that match the requested filters while preserving the same normalized archive structure

#### Scenario: Filters produce no matches
- **WHEN** a verified patient applies search or filter values that do not match any of that patient's records
- **THEN** the system shows a no-results state without clearing the active filter context unexpectedly

### Requirement: Patient Medical Record Detail And Asset Access
The system SHALL let a verified patient inspect the full stored note content for note-bearing record entries and SHALL allow the patient to open or download related record attachments, including stored meal plans, progress photos, and linked intake documents, through the application's existing secure asset-access pattern.

#### Scenario: Patient opens a consultation note or weekly review record
- **WHEN** a verified patient selects a medical-record entry that includes stored consultation notes or doctor review notes
- **THEN** the system reveals the full stored note body for that same patient's record without requiring the patient to leave the archive context

#### Scenario: Patient opens a stored attachment from a record entry
- **WHEN** a verified patient opens an attachment action for one of that patient's medical-record entries
- **THEN** the system provides access only to the attachment linked to that patient's record using the configured secure asset-delivery flow

### Requirement: Patient Medical Record Ownership Boundaries
The system SHALL enforce that medical-record archive results, note details, and attachment access remain limited to the signed-in verified patient who owns the underlying booking, consultation, or check-in records.

#### Scenario: Patient cannot access another patient's record content
- **WHEN** a patient attempts to request medical-record content or an attachment that belongs to a different patient
- **THEN** the system denies access and does not disclose the other patient's note or file metadata

#### Scenario: Non-patient roles cannot use the patient medical-records route
- **WHEN** a doctor or admin account attempts to access the patient medical-records module
- **THEN** the system rejects the request according to the existing role-scoped route authorization rules
