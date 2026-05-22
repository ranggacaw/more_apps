## 1. Implementation
- [x] 1.1 Add a verified patient route and controller action for `/patient/medical-records` that loads only the signed-in patient's eligible consultation and program record data.
- [x] 1.2 Normalize completed consultation notes, optional meal-plan assets, linked patient intake uploads, and weekly check-in or review history into a single patient-facing archive payload with category and date metadata.
- [x] 1.3 Build the responsive Inertia medical-records page and patient navigation entry using the reference UI as visual guidance while matching the existing MORE design system.
- [x] 1.4 Implement patient-facing search, category filtering, and date filtering for the archive without exposing records outside the signed-in patient's scope.
- [x] 1.5 Add secure note-detail and attachment access behavior for record entries, reusing temporary asset URLs where supported.
- [x] 1.6 Add feature tests for verified access, role restrictions, patient ownership boundaries, empty states, and filter behavior.
- [x] 1.7 Run targeted validation for the new page and tests, plus any required frontend lint or build checks used by this repo.

## Post-Implementation
- [x] Update the root `AGENTS.md` notes if the shipped workflow or key routes list needs to mention the new patient medical-records module.
