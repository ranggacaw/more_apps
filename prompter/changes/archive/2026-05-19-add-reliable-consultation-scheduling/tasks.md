## 1. Scheduling Workflow
- [x] 1.1 Add the `clinic-consultation-scheduling` capability by implementing the booking-facing doctor directory, recurring availability, slot search, slot locking, and checkout handoff behavior described in the approved spec.
- [x] 1.2 Expose the doctor profile fields needed by EPIC-002, including avatar data when present, across booking-facing doctor responses and the patient booking page.
- [x] 1.3 Restrict slot discovery and on-demand slot generation to active doctors and reservable future inventory while preserving the existing 15-minute lock semantics.
- [x] 1.4 Keep booking creation transactional so only the locking patient can create or reuse a pending booking for a still-valid slot lock before checkout.

## 2. Validation
- [x] 2.1 Add or update feature coverage for doctor discovery, availability-driven slot generation, active-doctor slot search, concurrent lock rejection, and checkout handoff.
- [x] 2.2 Run `php artisan test tests/Feature/ClinicMvpTest.php tests/Feature/DependablePlatformServicesTest.php` and `prompter validate add-reliable-consultation-scheduling --strict --no-interactive` before marking the change complete.

## Post-Implementation
- [x] Update `AGENTS.md` if the approved implementation introduces new scheduling or operational conventions that future contributors need to follow. No new contributor conventions were introduced, so no `AGENTS.md` update was required.
