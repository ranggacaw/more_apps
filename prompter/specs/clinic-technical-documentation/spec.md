# clinic-technical-documentation Specification

## Purpose
TBD - created by archiving change update-technical-docs-alignment. Update Purpose after archive.
## Requirements
### Requirement: Technical Documentation Accuracy
The project SHALL maintain `docs/more_apps_docs.md` as an implementation-aligned technical overview of the clinic application.

#### Scenario: Core technical sections are reviewed
- **WHEN** `docs/more_apps_docs.md` is updated
- **THEN** its stack, authentication, verification, routing, payment, scheduling, schema, and folder structure sections match the current application source and migrations

### Requirement: Operational Workflow Coverage
The project SHALL document the currently implemented patient, doctor, and admin workflows that materially affect how the clinic application operates.

#### Scenario: An engineer reviews role flows
- **WHEN** an engineer reads `docs/more_apps_docs.md`
- **THEN** the document describes the current role-based dashboard redirect, patient and doctor medical records, weekly program check-ins, package checkout rules, and admin broadcast, content, and user-management modules

