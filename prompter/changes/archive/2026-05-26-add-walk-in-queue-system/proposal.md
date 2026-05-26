# Change: Add Walk-In Patient Queue System

## Why
Clinic admins manage a physical waiting room where walk-in patients arrive and need to be assigned to available doctors. Today there is no in-app mechanism for this — doctors signal readiness and admins coordinate patients verbally. A digital queue gives admins a live view of who is waiting, which doctors are available, and lets doctors signal completion so admins can dispatch the next patient without leaving their desk.

## What Changes
- Add a `clinic_queue_entries` table to store walk-in patients with queue number, patient details, status, assigned doctor, and timestamps for each stage (queued, called, seen, done)
- Add an Admin queue management page at `/admin/queue` for adding patients, viewing the live queue, assigning patients to doctors, and seeing real-time doctor availability
- Add a Doctor queue panel embedded in the doctor dashboard showing the currently assigned walk-in patient with a prominent "Done" button
- Add polling-based admin notification: when a doctor clicks "Done", the admin queue page polls and updates within seconds to show that doctor as available and the patient as done
- Patient details (name, phone, complaint notes) and timestamps (queued, assigned, started, completed) are included throughout

## Impact
- Affected specs: `clinic-admin-operations-overview` (admin gets queue page), `clinic-consultation-delivery` (doctor sees assigned walk-in patient)
- New capability spec: `clinic-queue-management`
- Affected code:
  - New migration for `clinic_queue_entries`
  - New model `ClinicQueueEntry`
  - New controller `AdminQueueController` (admin queue CRUD + assign)
  - New controller method on `DoctorDashboardController` (mark-done endpoint)
  - New Inertia page `Admin/Queue.jsx` (admin queue management)
  - Modified `Doctor/Dashboard.jsx` or new component for current-patient panel
  - New routes in `routes/web.php`
