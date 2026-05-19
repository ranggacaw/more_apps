# clinic-storage-runtime Specification

## Purpose
TBD - created by archiving change add-dependable-platform-services. Update Purpose after archive.
## Requirements
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

### Requirement: Environment-Driven Runtime Configuration
The system SHALL read database, queue, mail, Midtrans, WhatsApp, meeting, and storage settings from environment-backed configuration so the same Laravel application can run across local and production environments without code changes.

#### Scenario: Environment switches runtime services
- **WHEN** deployment-specific environment values differ between local and production
- **THEN** the application uses the configured database, queue, mail, payment, messaging, meeting, and storage services for that environment

### Requirement: Single-Application Runtime Topology
The system SHALL support operation as one Laravel application with web, queue-worker, scheduler, and database runtime concerns in local Docker-based development and production VPS or Nginx hosting.

#### Scenario: Local Docker stack runs clinic services
- **WHEN** a developer starts the documented local stack
- **THEN** the application can run the web app, queue worker, and database services needed for clinic workflows

#### Scenario: Production runtime includes background processing
- **WHEN** the application is deployed to production
- **THEN** queue processing and scheduler execution are enabled alongside the web runtime so notifications, reminders, and slot-release automation continue to function

