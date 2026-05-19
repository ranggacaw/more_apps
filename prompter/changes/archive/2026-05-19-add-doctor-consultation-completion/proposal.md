# Change: Add Doctor Consultation Completion

## Why
EPIC-004 requires a consistent doctor workflow for executing paid consultations and handing patients off to the next step of care. The current app already stores consultations and allows a basic completion action, but it does not yet define the richer dashboard, intake-review, and follow-up notification behavior described by the epic.

## What Changes
- Add a new `clinic-consultation-delivery` capability for doctor-facing consultation workload review, booking intake context review, and consultation completion with notes plus an optional recommended package.
- Clarify that the available pre-consultation context for this change is the patient's existing booking intake data: `bookings.notes` and `bookings.patient_upload_path`.
- Extend queued background automation so consultation completion prompts the patient to continue to package selection after the booking is marked complete.
- Update the MVP and data-foundation specs so dashboard behavior and persisted consultation context align with the doctor workflow.

## Impact
- Affected specs: `clinic-consultation-delivery`, `clinic-data-foundation`, `clinic-background-automation`, `clinic-mvp`
- Affected code: `app/Http/Controllers/DoctorDashboardController.php`, `resources/js/Pages/Doctor/Dashboard.jsx`, `app/Models/Booking.php`, `app/Models/Consultation.php`, `app/Jobs/SendBookingNotificationJob.php`, related tests, and any supporting notification or package-query code used by the doctor completion flow
