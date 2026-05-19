# Change: Add Dependable Platform Services

## Why
EPIC-008 needs explicit operational requirements for the clinic platform's shared foundation. The current Laravel app already includes partial support for bookings, payments, queues, scheduling, and Docker runtime setup, but it does not yet define the full platform-service scope for the remaining entities, verified route enforcement, storage workflows, and provider-driven runtime behavior.

## What Changes
- Add capability specs for the core operational data model, including packages, user packages, check-ins, and consultations alongside the existing booking and payment entities.
- Add capability specs for authenticated, verified, and role-based route protection across patient, doctor, and admin flows.
- Add capability specs for secure Midtrans callbacks, provider-based outbound integrations, and local payment simulation for development.
- Add capability specs for queue-backed automation, slot-lock expiry handling, and reminder scheduling.
- Add capability specs for configurable storage and single-app runtime deployment expectations.

## Impact
- Affected specs: `clinic-data-foundation`, `clinic-access-control`, `clinic-service-integrations`, `clinic-background-automation`, `clinic-storage-runtime`
- Affected code: `database/migrations/2026_05_19_000001_create_clinic_mvp_tables.php`, `routes/web.php`, `bootstrap/app.php`, `app/Services/MidtransService.php`, `app/Jobs/SendBookingNotificationJob.php`, `routes/console.php`, `config/services.php`, `config/filesystems.php`, `.env.example`, `docker-compose.yml`
