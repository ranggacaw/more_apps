## 1. Doctor Consultation Workflow
- [x] 1.1 Update `app/Http/Controllers/DoctorDashboardController.php` and any supporting queries/resources so the doctor dashboard exposes the doctor's relevant confirmed consultation workload together with the intake context and completion state needed for EPIC-004.
- [x] 1.2 Update `resources/js/Pages/Doctor/Dashboard.jsx` to replace the current one-click completion path with an explicit consultation completion form that captures notes, supports an optional recommended package selection, and shows the available booking intake context or an empty state.
- [x] 1.3 Keep the completion route and controller authorization scoped to the assigned verified doctor and confirmed bookings only.

## 2. Consultation Persistence and Follow-Up
- [x] 2.1 Update consultation completion handling in `app/Http/Controllers/DoctorDashboardController.php` and any supporting models/resources so one consultation record is stored per booking and the booking transitions to `completed` only after the consultation data is persisted successfully.
- [x] 2.2 Extend the queued notification flow, likely in `app/Jobs/SendBookingNotificationJob.php` or a focused follow-up job, so completing a consultation prompts the patient to continue to package selection.

## 3. Validation
- [x] 3.1 Add or update feature tests covering doctor dashboard workload visibility, intake-context review, authorized consultation completion, and post-completion notification dispatch.
- [x] 3.2 Run `php artisan test` for the affected coverage and `prompter validate add-doctor-consultation-completion --strict --no-interactive` before requesting approval.

## Post-Implementation
- [x] Update `AGENTS.md` and `docs/more_apps_docs.md` if the implemented doctor consultation workflow changes the documented operator guidance.
