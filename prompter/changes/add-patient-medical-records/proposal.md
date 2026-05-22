# Change: Add patient medical records archive

## Why
Verified patients can currently see upcoming consultations, package progress, meal plans, and weekly review snippets on the dashboard, but they do not have a dedicated place to review their longitudinal clinical history. The provided reference UI points to a patient-facing medical-records archive, so the product needs a scoped first version that reuses already stored clinic data instead of inventing a separate record system.

## What Changes
- Add a verified patient medical-records route and page that aggregates existing consultation, package, and check-in history into a dedicated archive view.
- Expose completed consultation notes, optional meal-plan documents, linked intake-upload context, and weekly progress or doctor-review history as patient-facing record entries.
- Add search and filter controls aligned with the reference UI so patients can narrow records by text, category, and date window.
- Preserve strict ownership and asset authorization so patients can only read their own notes and open their own record attachments.
- Keep the first version read-only and derived from existing tables; do not introduce a new `medical_records` table, lab-result authoring workflow, or secure external share-link flow in this change.

## Impact
- Affected specs: `clinic-patient-medical-records`
- Affected code: `routes/web.php`, a new patient medical-records controller/page, `resources/js/Layouts/PatientLayout.jsx`, patient record query or mapping logic, secure asset delivery helpers, and patient feature coverage
