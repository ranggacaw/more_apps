## MODIFIED Requirements

### Requirement: Clinical Asset Storage
The system SHALL store patient booking uploads, weekly check-in progress photos, supporting clinical documents, and generated meal-plan PDFs on a configurable Laravel filesystem disk that can target local or S3-backed storage, and SHALL allow the application to issue temporary access URLs for those assets when the selected disk supports that capability.

#### Scenario: Local disk stores clinic assets in development
- **WHEN** the application runs with a local filesystem disk selected
- **THEN** patient uploads, weekly progress photos, and generated clinic documents are written to the configured local storage path

#### Scenario: S3-backed disk stores clinic assets in production
- **WHEN** the application runs with an S3-backed filesystem disk selected
- **THEN** the same upload, progress-photo, and document workflows store files through the configured S3 disk without code changes

#### Scenario: Program assets can be opened securely
- **WHEN** a patient or doctor needs to open a stored meal plan or weekly check-in media asset
- **THEN** the application can provide temporary asset access when the configured disk supports it without exposing raw storage-only paths in the UI
