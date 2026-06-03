# Change: Update In-Room Consultation Program Selection

## Why
Doctors already select slimming package options and aesthetic program treatments inside the consultation workspace, but walk-in queue patients currently only support start/done status actions. When a patient enters the room, the doctor needs one consistent in-room workflow for scheduled bookings and walk-ins to capture notes, measurements, and selected aesthetic or slimming programs.

## What Changes
- Treat the existing doctor consultation workspace as the in-room page for program selection instead of introducing a separate anesthesia page.
- Extend walk-in queue consultations so an assigned doctor can open the same in-room selection/completion workflow after starting the queue entry.
- Persist walk-in in-room completion with consultation records, treatment line items, dosage fields, and pending internal billing handoffs using the same rules as scheduled consultations.
- Update doctor dashboard/queue actions so walk-in patients move from Start Consultation into Open in-room workspace, then complete through that workspace.

## Impact
- Affected specs: `clinic-consultation-delivery`, `clinic-queue-management`, `clinic-package-commerce`
- Affected code: `routes/web.php`, `app/Http/Controllers/DoctorDashboardController.php`, queue and consultation models/migrations, `resources/js/Pages/Doctor/Dashboard.jsx`, `resources/js/Pages/Doctor/ConsultationWorkspace.jsx`, consultation and queue feature tests.
