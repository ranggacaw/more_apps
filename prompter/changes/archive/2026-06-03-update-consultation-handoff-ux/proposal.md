# Change: Update Consultation Handoff UX

## Why
Doctors and admins can already complete scheduled and walk-in consultations, but the handoff experience is fragmented: doctors must click twice to enter the walk-in workspace, walk-in medical records lose guest identity, consultation details and billing totals are hard to find, and admins can see pending on-site treatment payments without a clear way to mark them paid.

## What Changes
- Redirect doctors directly to the in-room consultation workspace immediately after starting an assigned walk-in consultation.
- Clarify aesthetic program treatment entry so each selected line shows Treatment Name from active master data, quantity, and selling price while keeping HPP hidden from doctors.
- Make completed walk-in and guest consultation records resolve patient identity from their source record, and show consultation details, line items, payment status, and paid/pending totals in the doctor medical-record detail workspace.
- Surface pending consultation-treatment billing handoffs for admins with enough source context to collect on-site payment and mark eligible internal treatment payments as paid.
- Keep paid revenue calculations cash-basis: pending handoffs remain excluded until an authorized admin marks them paid.

## Current Behavior Notes
- Walk-in consultation completion stores a queue-originated `consultations` row and creates a pending internal `payments` row of type `consultation_treatment` when chargeable line items exist.
- Those pending treatment handoffs are currently visible on `/finance/profit-loss`, but admins do not have an operational payment-capture action from the admin dashboard.
- `/doctor/medical-records` maps consultation identity only from `consultations.user_id`; walk-in consultations have `user_id = null`, so the table falls back to `Unknown patient` even though `clinic_queue_entries.patient_name` exists.
- The medical-record detail page currently links back to consultation workload instead of showing stored consultation line items and payment details.

## Impact
- Affected specs: `clinic-queue-management`, `clinic-consultation-delivery`, `clinic-medical-record-workspaces`, `clinic-package-commerce`, `clinic-admin-operations-overview`
- Affected code: `app/Http/Controllers/DoctorDashboardController.php`, `app/Http/Controllers/DoctorMedicalRecordController.php`, `app/Http/Controllers/AdminDashboardController.php`, payment/admin invoice controller routes, `resources/js/Pages/Doctor/Dashboard.jsx`, `resources/js/Pages/Doctor/ConsultationWorkspace.jsx`, `resources/js/Pages/Doctor/MedicalRecords.jsx`, `resources/js/Pages/Doctor/MedicalRecordDetail.jsx`, `resources/js/Pages/Admin/Dashboard.jsx`, related feature tests.
- Related pending change: `update-in-room-consultation-program-selection` is marked complete and overlaps walk-in workspace behavior; implementation should build on that completed code and reconcile specs during archive.
