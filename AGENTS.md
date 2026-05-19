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
- Midtrans for consultation payments
- Database queue for notifications and reminders

## Domain Rules
- Roles are stored on `users.role` and must be one of `patient`, `doctor`, or `admin`
- Patients register through the public form; doctor and admin accounts are seeded or created by the team
- Self-registered patients stay unverified until they complete the WhatsApp OTP flow at `/verify-otp`
- Authenticated operational routes also require a verified account before booking, checkout, dashboards, or admin actions are allowed
- Consultation checkout always initializes against the fixed Rp 500.000 fee configured in `clinic.consultation_fee`
- A booking is only confirmed after the payment callback marks the related payment as paid
- Doctors only complete consultations for their own `confirmed` bookings, and completion must store consultation notes before the booking moves to `completed`
- Locked slots expire after 15 minutes and the scheduler releases them again
- Clinic assets use the disk selected by `CLINIC_ASSET_DISK`, while WhatsApp, email, and meeting providers stay environment-driven

## Key Routes
- `/dashboard` redirects users to their role-specific dashboard
- `/patient/dashboard`, `/doctor/dashboard`, and `/admin/dashboard` are the primary operational pages
- `/book-consultation` is the patient booking entry point
- `/doctor/bookings/{booking}/complete` records doctor consultation completion and queues the patient follow-up prompt
- `/payment/webhook` receives Midtrans callbacks

## Local Development
- Use `docker-compose up --build` for the Docker-based stack
- Run the `scheduler` service alongside `app`, `queue`, and `pgsql` so slot releases and reminders continue to fire
- If Midtrans keys are missing, the checkout page falls back to demo payment simulation buttons that exercise the same success, pending, and failure server-side transitions in local MVP testing
