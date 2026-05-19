## 1. Data and Access Foundation
- [x] 1.1 Expand the schema and Eloquent relationships to cover packages, user packages, check-ins, consultations, and any missing constraints needed for slot-lock and payment history integrity.
- [x] 1.2 Enforce authenticated, verified, and role-based middleware on dashboards, booking routes, checkout routes, and operational endpoints.
- [x] 1.3 Keep public registration patient-only and provide seeded or authorized creation paths for doctor and admin accounts.

## 2. Integrations and Automation
- [x] 2.1 Harden the Midtrans webhook flow with signature validation, throttling, idempotent state transitions, and queued follow-up work.
- [x] 2.2 Add provider-oriented service boundaries for WhatsApp, email, and meeting-link generation so approved vendors can be swapped through configuration.
- [x] 2.3 Move OTP, confirmation, reminder, and package-activation outbound work onto the queue with retry-safe handlers.

## 3. Scheduling, Storage, and Runtime
- [x] 3.1 Implement scheduler coverage for 15-minute slot-lock release and the documented day-before and same-day reminder cadence.
- [x] 3.2 Add patient-upload and meal-plan PDF storage flows using a configurable local or S3-backed disk.
- [x] 3.3 Ensure local Docker and production runtime configuration cover the web app, queue worker, scheduler, database, and external-service credentials without code changes.

## 4. Validation
- [x] 4.1 Add feature and integration tests for route protection, webhook integrity, slot expiry, reminders, and storage configuration behavior.
- [x] 4.2 Run `php artisan test` plus targeted scheduler, queue, and runtime smoke checks before marking the change complete. Verified with `php artisan test`, `php artisan route:list`, `php artisan schedule:list`, `php artisan queue:work --once --stop-when-empty`, `docker compose config`, and `prompter validate add-dependable-platform-services --strict --no-interactive`.

## Post-Implementation
- [x] Update `AGENTS.md` in the project root for any new platform-service conventions introduced by this change.
