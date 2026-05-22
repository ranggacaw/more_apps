# Change: Refactor patient and doctor workspace navigation

## Why
Patient and doctor operational pages currently mix overview, browsing, detail reading, and data entry on the same screens. That makes navigation harder to understand, makes medical-record browsing inefficient at larger record volumes, leaves the patient package page more content-heavy than necessary, and turns the doctor dashboard into a long page instead of a fast daily overview.

## What Changes
- Add shared patient and doctor workspace-navigation requirements that separate overview, index, and detail workflows more clearly.
- Add dedicated medical-record workflow requirements for patient and doctor list/detail pages, including table-oriented browsing and focused record detail pages.
- Simplify the patient package catalog so credit status, package comparison, and checkout state are easier to understand at a glance.
- Redesign the doctor dashboard into a shorter overview page with drill-in paths to focused consultation and review workflows.
- Treat the existing unarchived `add-patient-medical-records` change as a dependency for the base patient archive capability, while this proposal layers the new navigation and list/detail behavior on top.

## Impact
- Affected specs: `clinic-role-workspace-navigation` (new), `clinic-medical-record-workspaces` (new), `clinic-package-commerce`, `clinic-consultation-delivery`
- Affected code: `routes/web.php`, `resources/js/Layouts/PatientLayout.jsx`, `resources/js/Layouts/DoctorLayout.jsx`, `app/Http/Controllers/PatientMedicalRecordController.php`, `app/Http/Controllers/DoctorMedicalRecordController.php`, `app/Http/Controllers/PaymentController.php`, `app/Http/Controllers/DoctorDashboardController.php`, related Inertia pages under `resources/js/Pages/Patient` and `resources/js/Pages/Doctor`, and feature coverage in `tests/Feature/PatientProgramWorkspaceTest.php`
