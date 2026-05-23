## 1. Navigation And Routing
- [x] 1.1 Simplify patient and doctor primary navigation labels and destinations so overview, archive, booking, package, and review workflows are clearly separated.
- [x] 1.2 Add or refactor dedicated patient and doctor routes/controllers for medical-record detail pages, preserving role scoping and a clear return path to the originating index state.
- [x] 1.3 Add any focused doctor drill-in routes needed to keep the dashboard as an overview instead of an all-in-one workspace.

## 2. Patient Workspaces
- [x] 2.1 Redesign `/patient/medical-records` into a scanning-first index optimized for larger histories with table or dense-list presentation, filters, and pagination or equivalent chunked navigation.
- [x] 2.2 Implement a distinct patient medical-record detail page that shows the selected record's full notes, attachments, and metadata without mixing it into the index.
- [x] 2.3 Simplify `/patient/packages` around credit status, package comparison, and current checkout state while removing redundant explanatory content.

## 3. Doctor Workspaces
- [x] 3.1 Redesign `/doctor/dashboard` into a shorter overview page with clear summaries for schedule, pending reviews, and next actions.
- [x] 3.2 Rework `/doctor/medical-records` into a table-oriented archive index with explicit row actions for opening a focused detail page.
- [x] 3.3 Implement a separate doctor medical-record detail workspace that keeps consultation records readable and progress records editable without inline archive editing.

## 4. Validation
- [x] 4.1 Update feature coverage for patient and doctor navigation, medical-record index/detail access, package-catalog clarity states, and doctor dashboard drill-in flows.
- [x] 4.2 Run `php artisan test --filter=PatientProgramWorkspaceTest` and any additional targeted feature tests for the updated doctor dashboard and package flows.
- [x] 4.3 Update the root `AGENTS.md` notes only if the shipped key-route list or workflow descriptions materially change.
