## MODIFIED Requirements
### Requirement: Doctor Medical Record Archive Index Navigation
The system SHALL provide verified doctors with a medical-record archive index optimized for patient lookup and high-volume review, using a table or dense-list presentation that surfaces patient identity, record type, date, status, package context, and an explicit action to open a separate record workspace. Consultation records SHALL resolve patient identity from the registered patient relationship, guest booking fields, or walk-in queue entry fields before falling back to an unknown-patient label.

#### Scenario: Doctor browses the archive for a patient record
- **WHEN** a verified doctor opens the doctor medical-record archive
- **THEN** the system presents records in a scanning-first list format that makes it easy to compare patient, record, status, and date fields before opening one record workspace

#### Scenario: Doctor browses walk-in consultation records
- **WHEN** a completed consultation is linked to a walk-in queue entry without a registered patient account
- **THEN** the archive displays the queue patient name and available phone number instead of `Unknown patient`

#### Scenario: Doctor searches guest or walk-in patient identity
- **WHEN** a doctor filters or searches medical records by a guest booking name, guest WhatsApp, walk-in patient name, or walk-in phone number
- **THEN** matching consultation records are included in the archive results

#### Scenario: Doctor uses the archive on a smaller screen
- **WHEN** a doctor opens the archive on a smaller viewport where a full table is not practical
- **THEN** the system still preserves the same scan-first index and separate detail-page workflow using a responsive dense-list alternative

### Requirement: Doctor Medical Record Detail Workspace
The system SHALL let the responsible doctor open a focused medical-record detail workspace for one selected record, showing read-only consultation context for consultation records and streamlined editing or review controls for progress records without requiring inline editing on the archive index page. Consultation detail workspaces SHALL show stored clinical notes, intake or walk-in complaint context, Slimming Monitoring Form metrics when present, treatment line items, and related payment status and amount details when a consultation-originated billing handoff exists.

#### Scenario: Doctor opens a progress record for focused editing
- **WHEN** a verified doctor opens a progress-type medical record from the archive index
- **THEN** the system shows that single record's patient context, stored files, and progress-editing controls on a dedicated detail page

#### Scenario: Doctor opens a consultation record from the archive index
- **WHEN** a verified doctor opens a consultation-type medical record from the archive index
- **THEN** the system shows the full consultation detail on a dedicated read-only page without exposing progress-entry editing controls that do not apply to that record

#### Scenario: Consultation record has treatment line items and pending payment
- **WHEN** a verified doctor opens a completed consultation record with selected treatment line items and a related pending internal payment
- **THEN** the detail workspace shows each treatment name, quantity, selling price total, and the payment status as pending with the total amount

#### Scenario: Consultation record has paid on-site payment
- **WHEN** a verified doctor opens a completed consultation record whose related internal treatment payment has been marked paid
- **THEN** the detail workspace shows the paid status, paid timestamp when available, and paid amount without allowing the doctor to mutate payment status
