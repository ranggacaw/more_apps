## Context
The current clinic application already stores the main ingredients of a patient medical-history experience across existing tables: completed consultation notes in `consultations`, intake notes and optional uploads on `bookings`, weekly progress submissions and doctor review notes on `check_ins`, and meal-plan PDFs on storage-backed clinic assets. Patients can see fragments of this data on the dashboard, but there is no dedicated archive route, normalized record model for the UI, or filtering flow.

The reference UI suggests a richer medical-records surface with grouped cards, search, filters, and note or document access. The codebase does not currently have a lab-results model, arbitrary clinician document uploads, or secure share-link issuance, so the proposal should avoid inventing those subsystems in the first pass.

## Goals / Non-Goals
Goals:
- Provide a dedicated patient medical-records page for verified patients.
- Reuse existing persisted clinic data instead of adding a parallel records store.
- Make consultation notes, program reviews, and available record attachments easy to discover and open.
- Support archive filtering patterns that match the reference UI at an MVP level.

Non-Goals:
- No new `medical_records` table or background synchronization job.
- No lab-result creation, upload, review, or status-management workflow.
- No external record-sharing or expiring secure-link generation.
- No new doctor or admin authoring screens beyond the records already captured by current workflows.

## Decisions
- Decision: Build the archive as a read-only derived view over existing `consultations`, `bookings`, `user_packages`, and `check_ins` data.
- Why: The data already exists, this keeps the first implementation tightly scoped, and it avoids duplicating clinical history into a second persistence model that would need backfill and long-term synchronization.

- Decision: Treat completed consultations and weekly program check-ins as the primary record sources, with optional attachments exposed through those records.
- Why: These are the existing patient-relevant clinical artifacts already supported by the app. They cover consultation notes, package-context documents, weekly review notes, and progress media without requiring new clinical authoring tools.

- Decision: Represent the UI with a normalized archive payload that includes record type, title, summary, clinician/source context, event date, status, full-note availability, and attachment actions.
- Why: The frontend needs a single list for search, filters, and grouping even though the data comes from different tables.

- Decision: Exclude unsupported reference-UI concepts such as laboratory result status cards and secure external share links from this change.
- Why: There is no current domain workflow, storage shape, or authorization model for those features, so including them would turn a scoped patient archive into a broader records-management project.

## Risks / Trade-offs
- Derived records can feel less uniform than a purpose-built `medical_records` table. Mitigation: normalize the response shape in the controller so the UI still receives one consistent archive contract.
- Search and filters may need to operate across mixed record types with different metadata. Mitigation: define a small supported filter surface for MVP categories and date windows rather than exposing every field.
- Exposing attachments increases the importance of ownership checks. Mitigation: reuse existing patient-scoped queries and temporary asset URLs instead of direct raw paths.

## Migration Plan
1. Add the new patient route, controller, and UI without changing existing dashboard behavior.
2. Reuse current models and storage helpers to derive record entries.
3. Add navigation to the patient shell after the route is available.
4. Ship with feature tests covering visibility and authorization boundaries.

## Open Questions
- None for this MVP proposal; the first version intentionally limits records to data already persisted by current workflows.
