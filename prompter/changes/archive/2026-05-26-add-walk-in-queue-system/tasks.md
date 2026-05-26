## 1. Database & Model

- [x] 1.1 Create migration `clinic_queue_entries` table with columns: `id`, `queue_number` (string, unique per day), `patient_name`, `patient_phone` (nullable), `complaint_notes` (nullable), `doctor_id` (nullable FK -> doctors), `status` (string, default `waiting`), `queued_at`, `assigned_at`, `consultation_started_at`, `completed_at`, `cancelled_at` (all nullable timestamps), `created_at`, `updated_at`
- [x] 1.2 Create `ClinicQueueEntry` model with fillable, casts (all timestamp fields to datetime), doctor relationship, scope for active entries, and a static method to generate the next daily queue number

## 2. Admin Queue Backend

- [x] 2.1 Create `AdminQueueController` with:
  - `index()` — returns Inertia page `Admin/Queue` with active queue entries grouped by status and active doctors with their current patient
  - `api()` — returns JSON with the same data for polling (lightweight, no Inertia overhead)
  - `store()` — validates patient_name (required), patient_phone, complaint_notes; creates entry with `waiting` status and daily queue number
  - `assign()` — validates entry is `waiting` and doctor is active; sets doctor_id, status to `assigned`, assigned_at
  - `cancel()` — validates entry is `waiting` or `assigned`; sets status to `cancelled`, cancelled_at
- [x] 2.2 Add admin routes: `GET /admin/queue`, `GET /admin/queue/api`, `POST /admin/queue`, `PATCH /admin/queue/{entry}/assign`, `PATCH /admin/queue/{entry}/cancel` — all within `auth + verified + role:admin` middleware

## 3. Doctor Queue Backend

- [x] 3.1 Add methods to `DoctorDashboardController`:
  - `queueStatus()` — returns JSON with the doctor's current `assigned` or `in_consultation` queue entry
  - `startQueueConsultation()` — validates entry is `assigned` to this doctor; sets status to `in_consultation`, consultation_started_at
  - `completeQueueConsultation()` — validates entry is `in_consultation` for this doctor; sets status to `completed`, completed_at
- [x] 3.2 Add doctor routes: `GET /doctor/queue/api`, `POST /doctor/queue/{entry}/start`, `POST /doctor/queue/{entry}/done` — all within `auth + verified + role:doctor` middleware

## 4. Admin Queue Frontend

- [x] 4.1 Create `Admin/Queue.jsx` Inertia page with:
  - Queue entry form (patient name, phone, complaint notes, "Add to Queue" button)
  - Waiting list section showing unassigned entries with "Assign to Doctor" dropdown
  - Active consultations section showing assigned/in-consultation entries with doctor name and patient details
  - Doctor availability sidebar showing each active doctor's current status (available / seeing patient)
  - Polling via `setInterval` calling `/admin/queue/api` every 5 seconds to refresh data
- [x] 4.2 Modify `Admin/Dashboard.jsx` to add a walk-in queue summary card with waiting/active counts and a link to `/admin/queue`

## 5. Doctor Queue Frontend

- [x] 5.1 Add a "Current Walk-In Patient" panel to `Doctor/Dashboard.jsx` showing:
  - Patient name, queue number, complaint notes, assigned time
  - "Start Consultation" button (when status is `assigned`)
  - "Done" button (when status is `in_consultation`)
  - Empty state when no patient assigned
- [x] 5.2 Add polling (every 5 seconds) to refresh the doctor's queue patient status from `/doctor/queue/api`

## 6. Admin Dashboard Backend Update

- [x] 6.1 Update `AdminDashboardController::__invoke()` to include `queue_summary` (counts of waiting, assigned, in_consultation entries) in the Inertia props

## 7. Validation & Testing

- [x] 7.1 Test: Admin can add, assign, and cancel queue entries
- [x] 7.2 Test: Doctor can start and complete walk-in consultations
- [x] 7.3 Test: Admin queue polling returns updated data after doctor marks done
- [x] 7.4 Test: Queue number increments daily and resets next day
- [x] 7.5 Test: Only assigned doctor can start/complete their own queue entry
- [x] 7.6 Test: Cannot assign a non-waiting entry or assign to an inactive doctor

## Post-Implementation

- [x] Update AGENTS.md in the project root with the new queue routes and the walk-in queue feature description
