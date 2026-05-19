# Change: Add Patient Program Workspace

## Why
EPIC-006 requires the clinic app to stay useful after package purchase, not just before payment and consultation completion. The current codebase has package activation, meal-plan PDF generation, and an admin-only check-in path, but it does not yet provide the patient-facing weekly progress workspace or the doctor-facing active-program review flow described in the docs.

## What Changes
- Add a patient program-engagement capability for active-package visibility, meal-plan access, weekly check-in submission, progress history, and a derived dashboard engagement feed built from existing records.
- Add a doctor program-review capability for active patient rosters, weekly check-in review, and follow-up adjustment notes without introducing full program versioning.
- Extend the existing `check_ins` data model to support weekly progress metrics, optional progress photos, and doctor review metadata while preserving current operational check-ins that track package-credit usage.
- Extend storage and background automation expectations to cover progress-photo assets, meal-plan access, weekly reminder touchpoints, and review follow-up notifications.

## Impact
- Affected specs: `clinic-patient-program-engagement`, `clinic-doctor-program-review`, `clinic-data-foundation`, `clinic-storage-runtime`, `clinic-background-automation`
- Affected code: `app/Http/Controllers/PatientDashboardController.php`, `app/Http/Controllers/DoctorDashboardController.php`, new patient and doctor program controllers/routes, `app/Models/CheckIn.php`, `app/Models/UserPackage.php`, `app/Models/Consultation.php`, `app/Services/ClinicAssetService.php`, `app/Services/PackageService.php`, `app/Jobs/SendUserPackageNotificationJob.php`, `resources/js/Pages/Patient/Dashboard.jsx`, new patient and doctor program pages/components, and follow-on migrations for weekly progress and review fields
