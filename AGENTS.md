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
- Roles are stored on `users.role` and must be one of `patient`, `doctor`, or `admin`
- Patients register through the public form; doctor and admin accounts are seeded or created by the team
- Self-registered patients stay unverified until they complete the WhatsApp OTP flow at `/verify-otp`
- Authenticated operational routes also require a verified account before booking, checkout, dashboards, or admin actions are allowed
- Doctor package management is create, update, and deactivate only; deactivated packages must disappear from new patient checkout while historical `payments` and `user_packages` keep their existing package links
- Admin WhatsApp broadcasts are stored in `whatsapp_broadcasts` and `whatsapp_broadcast_deliveries`, support only the approved audience scopes `verified_patients`, `patients`, `doctors`, `admins`, and `all_users`, and always queue delivery work instead of sending inline with the request
- Admin educational content lives in `educational_contents` with `draft` and `published` states, optional managed assets, and published records currently surface on the public home page
- Team-managed admin user provisioning can mark accounts as verified directly, and changing a doctor account to another role must preserve the doctor profile record while making it inactive for future scheduling
- Consultation checkout always initializes against the fixed Rp 500.000 fee configured in `clinic.consultation_fee`
- A booking is only confirmed after the payment callback marks the related payment as paid, except for admin-assisted bookings which are confirmed immediately without Midtrans
- Admin-assisted bookings support registered patients and guest patients (no account required; guest WhatsApp is mandatory for guest bookings), with `offline` and `online` consultation modes
- Online admin-assisted bookings require the assigned doctor to provide a Google Meet URL before the consultation can be completed; the doctor submits the link from the consultation workspace
- Admin-assisted bookings bypass Midtrans payment creation entirely and do not award consultation credits
- `bookings.user_id` is nullable to support guest bookings; display identity resolves from either the registered patient relationship or the `guest_patient_name`/`guest_whatsapp` fields
- Doctors only complete consultations for their own `confirmed` bookings, and completion must store consultation notes before the booking moves to `completed`
- Paid consultation callbacks award one outstanding patient consultation credit, and package checkout can only use that credit while it is unexpired, unconsumed, and linked to a completed qualifying consultation
- Package purchases with a remaining balance stay webhook-authoritative through Midtrans, while zero-balance package purchases activate immediately without an external payment session
- Weekly patient progress submissions reuse the `check_ins` table with `program_week`, metric, photo, and review fields, and those weekly entries must never decrement `user_packages.consultation_credits_remaining`
- Doctor follow-up on weekly progress is stored back on the same `check_ins` row, while weekly reminder deduplication stays in `user_packages.metadata`
- Locked slots expire after 15 minutes and the scheduler releases them again
- Clinic assets use the disk selected by `CLINIC_ASSET_DISK`, while WhatsApp, email, and meeting providers stay environment-driven
- Walk-in queue entries are stored in `clinic_queue_entries` and track daily walk-in patients (name, phone, complaint, doctor_id, status, and stages timestamps: queued, assigned, consultation started, completed, cancelled)

## Key Routes
- `/dashboard` redirects users to their role-specific dashboard
- `/patient/dashboard`, `/doctor/dashboard`, and `/admin/dashboard` are the primary operational overview pages
- `/patient/medical-records` is the verified patient archive index for completed consultation notes, attachments, and weekly progress history, while `/patient/medical-records/{recordType}/{recordId}` opens one focused patient record detail page
- `/doctor/consultations` is the doctor consultation workload index, and `/doctor/consultations/{booking}` opens the focused consultation-completion workspace for one confirmed booking
- `/doctor/program-reviews` is the focused doctor weekly follow-up workspace for active patient programs
- `/doctor/medical-records` is the doctor archive index, while `/doctor/medical-records/{recordType}/{recordId}` opens one focused doctor medical-record workspace for reading or progress updates
- `/doctor/packages` is the doctor package catalog management page for create, update, and deactivate operations
- `/admin/reports`, `/admin/broadcasts`, `/admin/content`, `/admin/users`, and `/admin/bookings` are the admin back-office modules for reporting, communications, content, account operations, and assisted booking creation
- `/patient/packages` is the patient package-browsing and credit-aware checkout page
- `POST /patient/user-packages/{userPackage}/check-ins` records one weekly patient progress submission for the package's current program week
- `/book-consultation` is the patient booking entry point
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

## Local Development
- Use `docker-compose up --build` for the Docker-based stack
- Run the `scheduler` service alongside `app`, `queue`, and `pgsql` so slot releases and reminders continue to fire
- If Midtrans keys are missing, the consultation and funded package checkout pages fall back to demo payment simulation buttons that exercise the same success, pending, and failure server-side transitions in local MVP testing
