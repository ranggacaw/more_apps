<!-- PROMPTER:START -->
# Prompter Instructions

These instructions are for AI assistants working in this project.

Always open `@/prompter/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/prompter/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines
- Show Remaining Tasks

<!-- PROMPTER:END -->

# MORE Clinic App Notes

## Stack
- Laravel 12 backend with Inertia.js and React frontend
- PostgreSQL as the primary runtime database
- Midtrans for consultation and funded package payments
- Database queue for notifications and reminders

## Domain Rules
- Roles are stored on `users.role` and operational accounts must be one of `doctor`, `admin`, or `super_admin`
- Patient self-registration, patient login/workspaces, and WhatsApp OTP verification are removed; clinic staff manage patient-facing workflows in the application
- Authenticated operational routes also require a verified staff account before dashboards, doctor workflows, finance, or admin actions are allowed
- Doctor package management is create, update, and deactivate only; deactivated packages must disappear from doctor package selection while historical `payments` and `user_packages` keep their existing package links
- Admin WhatsApp broadcasts are stored in `whatsapp_broadcasts` and `whatsapp_broadcast_deliveries`, support only the approved audience scopes `doctors`, `admins`, and `all_users`, and always queue delivery work instead of sending inline with the request
- Admin educational content lives in `educational_contents` with `draft` and `published` states, optional managed assets, and published records currently surface on the public home page
- Team-managed admin user provisioning can mark accounts as verified directly, and changing a doctor account to another role must preserve the doctor profile record while making it inactive for future scheduling
- Finance statement read access under `/finance` is limited to verified `super_admin` and `doctor` users; finance mutations are limited to verified `super_admin` users, and existing `admin` users are intentionally excluded from `/finance`
- Profit and loss reporting is cash-basis from paid `payments`, `payments.return_amount`, `payments.hpp_amount`, and `operating_expenses`; balance-sheet reporting uses cumulative net income plus manual `balance_sheet_entries`
- Finance reports are a simplified managerial view only; inventory catalog, stock movement, POS/product sales, automatic stock deduction, FIFO costing, and full double-entry accounting are deferred
- Consultation checkout always initializes against the fixed Rp 500.000 fee configured in `clinic.consultation_fee`
- A booking is only confirmed after the payment callback marks the related payment as paid, except for admin-assisted bookings which are confirmed immediately without Midtrans
- Admin-assisted bookings support registered patients and guest patients (no account required; guest WhatsApp is mandatory for guest bookings), with `offline` and `online` consultation modes
- Online admin-assisted bookings require the assigned doctor to provide a Google Meet URL before the consultation can be completed; the doctor submits the link from the consultation workspace
- Admin-assisted bookings bypass Midtrans payment creation entirely and do not award consultation credits
- `bookings.user_id` is nullable to support guest bookings; display identity resolves from either the registered patient relationship or the `guest_patient_name`/`guest_whatsapp` fields
- Doctors only complete consultations for their own `confirmed` bookings, and completion must store consultation notes or Slimming Monitoring Form metrics before the booking moves to `completed`
- Doctor-selected packages during consultation completion create pending internal package invoices for admins; admin finalization marks the invoice paid and activates consultation credits
- Doctor consultation completion can also snapshot doctor-only treatment line items, active slimming trial/package options, Diamond oral-medication add-ons only with a Diamond primary option, active Aesthetic Program selections, dosage details defaulting to `ml`, quantity, notes, selling-price snapshots, and HPP snapshots where admin master data provides them
- Empty dosage in the doctor consultation UI is warning-only; doctors can continue after acknowledging the warning, while non-doctor roles cannot submit dosage through doctor completion routes
- Chargeable consultation treatment/package/program line items create a pending internal `payments` record with type `consultation_treatment`, provider `internal`, booking and consultation links, line-item payload snapshots, total amount, and total HPP; these records do not create Midtrans snap sessions, award consultation credits, or activate `user_packages`
- Internal consultation-treatment payments are visible on finance profit-and-loss pages as pending billing handoffs, but paid revenue calculations remain cash-basis from `status = paid` payments only
- Paid consultation callbacks award one outstanding patient consultation credit, and package checkout can only use that credit while it is unexpired, unconsumed, and linked to a completed qualifying consultation
- Package purchases with a remaining balance stay webhook-authoritative through Midtrans, while zero-balance package purchases activate immediately without an external payment session
- Weekly patient progress submissions reuse the `check_ins` table with `program_week`, metric, photo, and review fields, and those weekly entries must never decrement `user_packages.consultation_credits_remaining`
- Doctor follow-up on weekly progress is stored back on the same `check_ins` row, while weekly reminder deduplication stays in `user_packages.metadata`
- Locked slots expire after 15 minutes and the scheduler releases them again
- Clinic assets use the disk selected by `CLINIC_ASSET_DISK`, while WhatsApp, email, and meeting providers stay environment-driven
- Walk-in queue entries are stored in `clinic_queue_entries` and track daily walk-in patients (name, phone, complaint, doctor_id, status, and stages timestamps: queued, assigned, consultation started, completed, cancelled)
- Aesthetic Program master data is managed by admins under `/admin/aesthetic-programs` with name, selling price, HPP/COGS, active state, gross margin display, and soft/historical preservation for in-use records; doctor payloads expose only active program id/name/price
- Clinic operating hours are stored in `clinic_operating_hours`, seeded by `ConsultationTreatmentBillingSeeder` to Monday-Friday 16:00-20:00 and Saturday-Sunday 10:00-20:00, and are the shared source for admin slot search and booking for every active doctor
- Admin standard booking confirmation rejects outside-hours appointments with `Appointments are only available during clinic hours.`
- Admin-assisted outside-hours bookings require explicit override intent and a reason; successful overrides are audited in `schedule_override_logs` with admin, doctor, slot/booking, affected date/time, and reason

## Key Routes
- `/dashboard` redirects users to their role-specific dashboard
- `/doctor/dashboard` and `/admin/dashboard` are the primary operational overview pages, while `super_admin` users are redirected from `/dashboard` to `/finance/profit-loss`
- `/doctor/consultations` is the doctor consultation workload index, and `/doctor/consultations/{booking}` opens the focused consultation-completion workspace for one confirmed booking
- `/doctor/program-reviews` is the focused doctor weekly follow-up workspace for active patient programs
- `/doctor/medical-records` is the doctor archive index, while `/doctor/medical-records/{recordType}/{recordId}` opens one focused doctor medical-record workspace for reading or progress updates
- `/doctor/packages` is the doctor package catalog management page for create, update, and deactivate operations
- `/admin/reports`, `/admin/invoices`, `/admin/broadcasts`, `/admin/content`, `/admin/users`, and `/admin/bookings` are the admin back-office modules for reporting, package invoice processing, communications, content, account operations, and assisted booking creation
- `/admin/aesthetic-programs` manages Aesthetic Program master data, and `/admin/schedule-settings` manages clinic operating hours plus displays recent schedule override audits
- `/finance/profit-loss` and `/finance/balance-sheet` are finance statement pages available read-only to doctors and fully to super admins
- `/finance/profit-loss` also lists pending internal consultation-treatment billing handoffs for authorized finance readers without including them in paid revenue totals
- `POST|PATCH|DELETE /finance/operating-expenses` manages operating expense rows for super admins only
- `POST|PATCH|DELETE /finance/balance-sheet-entries` manages manual balance-sheet entries for super admins only
- `/doctor/bookings/{booking}/complete` records doctor consultation completion and queues the patient follow-up prompt
- `POST /doctor/bookings/{booking}/meeting-link` saves or updates the doctor-supplied Google Meet link for an online admin-assisted booking and queues patient or guest notification
- `POST /doctor/check-ins/{checkIn}/review` stores doctor review notes for a weekly progress check-in and queues the patient follow-up notification
- `/payment/webhook` receives Midtrans callbacks
- `/admin/queue` is the admin live queue management page (with JSON polling at `/admin/queue/api`)
- `PATCH /admin/queue/{entry}/assign` assigns a waiting queue entry to a doctor
- `PATCH /admin/queue/{entry}/cancel` cancels a queue entry
- `GET /doctor/queue/api` retrieves a doctor's current active walk-in patient
- `POST /doctor/queue/{entry}/start` starts a doctor's walk-in consultation
- `POST /doctor/queue/{entry}/done` completes a doctor's walk-in consultation

## Admin Data Tables
- The admin Users, Broadcasts, and Content pages use the shared `AdminDataTable` component (`resources/js/Components/AdminDataTable.jsx`) for server-side paginated, sortable data tables with optional expandable row editors
- All three admin controllers (`AdminUserController`, `AdminBroadcastController`, `AdminContentController`) use `->paginate(15)` and pass pagination meta (`current_page`, `last_page`, `per_page`, `total`) plus `sortBy`/`sortDir` state to Inertia responses
- Column headers with `meta.sortKey` are automatically sortable via Inertia visits with `sort_by`/`sort_dir` query params
- Users and Content tables have expandable rows for inline editing; Broadcasts table is read-only

## Finance Data Tables
- `payments.return_amount` and `payments.hpp_amount` default to zero and store manual IDR values used by finance statements
- `operating_expenses` stores soft-deletable expense inputs with name, optional category, amount, expense date, and notes for profit and loss reporting
- `balance_sheet_entries` stores soft-deletable manual asset, equity, and liability rows with label, optional category, amount, entry date, and notes for balance-sheet reporting
- `FinanceReportService` calculates statement totals; `/finance` pages render super-admin mutation controls and doctor read-only views

## Local Development
- Use `docker-compose up --build` for the Docker-based stack
- Run the `scheduler` service alongside `app`, `queue`, and `pgsql` so slot releases and reminders continue to fire
- If Midtrans keys are missing, remaining Midtrans-backed payment flows can use local demo simulation buttons where routes still expose them
