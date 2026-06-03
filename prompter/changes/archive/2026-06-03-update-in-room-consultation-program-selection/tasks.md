## 1. Data Model
- [x] 1.1 Add nullable queue-source linkage for consultations and billing traceability, preserving existing booking-based records.
- [x] 1.2 Update `ClinicQueueEntry`, `Consultation`, and related relationships so queue-originated consultations can be resolved and displayed.

## 2. Backend Workflow
- [x] 2.1 Add doctor routes for opening and completing the in-room workspace from an assigned `in_consultation` walk-in queue entry.
- [x] 2.2 Refactor the existing doctor consultation payload mapping so scheduled bookings and queue entries can render the same workspace with source-specific patient identity, intake/complaint context, and completion URL.
- [x] 2.3 Reuse existing line-item validation/building for slimming options, Diamond add-ons, aesthetic programs, dosage fields, and manual treatments across both sources.
- [x] 2.4 Ensure completing a queue-originated workspace creates one consultation record, creates pending internal treatment billing only when chargeable lines exist, and marks the queue entry `completed`.
- [x] 2.5 Keep scheduled booking completion behavior unchanged, including Google Meet link blocking for online admin-assisted bookings.

## 3. Frontend Workflow
- [x] 3.1 Update `Doctor/ConsultationWorkspace.jsx` to accept source-aware labels, patient context, back URL, and completion route while preserving existing scheduled consultation behavior.
- [x] 3.2 Update the doctor dashboard walk-in panel so `Start Consultation` transitions to `Open in-room workspace` for `in_consultation` queue entries instead of relying on a bare done action.
- [x] 3.3 Ensure the in-room workspace clearly presents aesthetic program selection and slimming program/package selection for both scheduled and walk-in patients.

## 4. Validation
- [x] 4.1 Add or update feature tests for walk-in start, workspace authorization, program selection submission, queue completion, and billing handoff creation.
- [x] 4.2 Add regression coverage proving unassigned doctors cannot open or complete another doctor's queue-originated workspace.
- [x] 4.3 Run the relevant Laravel feature tests, including existing consultation billing and queue tests.

## Post-Implementation
- [x] Update `AGENTS.md` if the implemented behavior changes project-level domain notes or key routes.
