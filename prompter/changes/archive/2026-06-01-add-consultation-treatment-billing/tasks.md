## 1. Data Model And Seed Data
- [x] 1.1 Add migrations for `aesthetic_programs`, consultation package-option records, consultation line items, clinic operating hours, schedule override logs, and consultation-originated payment links/nullable user support where needed for guest billing.
- [x] 1.2 Add or update Eloquent models, relationships, fillable fields, casts, and factories for aesthetic programs, package options, consultation line items, clinic hours, and schedule override logs.
- [x] 1.3 Seed default clinic hours for Monday-Friday 16:00-20:00 and Saturday-Sunday 10:00-20:00.
- [x] 1.4 Seed Basic Trial, Basic 4-week, Advanced Trial, Advanced 4x, Diamond Trial, Diamond 3x, and Diamond oral medication add-on option records with the requested prices, frequencies, and durations.

## 2. Admin Master Data And Settings
- [x] 2.1 Add admin routes/controllers for Aesthetic Program create, list, update, deactivate/delete, sorting, and pagination using existing admin authorization.
- [x] 2.2 Add an Inertia admin Aesthetic Programs page using `AdminLayout`, `AdminDataTable`, existing form components, Rp formatting, active/inactive controls, and gross margin display.
- [x] 2.3 Add admin routes/controllers/pages for clinic operating-hour settings and audited schedule overrides with required reason capture.
- [x] 2.4 Update admin navigation to expose Aesthetic Programs and Schedule Settings without changing non-admin access.

## 3. Doctor Consultation Workspace
- [x] 3.1 Update `DoctorDashboardController::showConsultation` to load active consultation package options, active aesthetic program search data, last-used patient package selection, and existing consultation line items.
- [x] 3.2 Update `resources/js/Pages/Doctor/ConsultationWorkspace.jsx` with reusable package selection, Diamond add-on handling, aesthetic program search, and treatment line-item inputs for quantity, dosage value, dosage unit defaulting to `ml`, notes, and price preview.
- [x] 3.3 Add warning-only empty dosage behavior in the doctor UI so doctors are warned before finalizing but are not blocked from completion.
- [x] 3.4 Update `DoctorDashboardController::complete` validation and persistence to store consultation notes, package/program line items, dosage details, selected option snapshots, attending doctor linkage, and completion timestamp atomically.
- [x] 3.5 Ensure doctor payloads never expose Aesthetic Program HPP/COGS while admin payloads do.

## 4. Billing Handoff
- [x] 4.1 Create pending internal `payments` records on consultation completion when chargeable line items exist, with amount totals, HPP totals where available, payment type/provider metadata, booking/consultation links, and guest-safe identity through the booking.
- [x] 4.2 Ensure consultation-originated internal payments do not create Midtrans snap sessions, do not award consultation credits, and do not activate `user_packages` without a later settlement flow.
- [x] 4.3 Update payment/finance display code only as needed so pending consultation-originated bills are visible to authorized billing/finance users without affecting paid revenue calculations.

## 5. Scheduling Enforcement
- [x] 5.1 Update `TimeSlotService` slot generation/search to intersect doctor availability with active clinic operating hours.
- [x] 5.2 Update patient slot search, lock, and booking confirmation flows to reject outside-hours attempts with `Appointments are only available during clinic hours.`
- [x] 5.3 Update admin booking slot search/confirmation to use normal clinic-hour rules unless an explicit admin override with reason is submitted and audited.
- [x] 5.4 Update booking pages to dynamically show available slots and clinic-hour context for the selected day.

## 6. Tests And Validation
- [x] 6.1 Add feature tests for admin Aesthetic Program CRUD, active/inactive filtering, gross margin calculation, and HPP visibility restrictions.
- [x] 6.2 Add feature tests for doctor consultation completion with treatment dosage, empty-dosage warning allowance, package option selection, Diamond add-on rules, and multiple aesthetic programs.
- [x] 6.3 Add feature tests proving consultation completion creates pending internal payment records with correct totals and does not trigger Midtrans, credits, or package entitlement activation.
- [x] 6.4 Add scheduling tests for default clinic hours, dynamic weekday/weekend slot availability, patient outside-hours rejection message, and audited admin overrides.
- [x] 6.5 Run `php artisan test` and `npm run build`.

## Post-Implementation
- [x] Update `AGENTS.md` with new routes, data tables, consultation billing behavior, clinic-hour rules, and any deferred payment-collection notes.
