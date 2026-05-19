# Change: Add Reliable Consultation Scheduling

## Why
EPIC-002 needs a dedicated scheduling specification that goes deeper than the current umbrella `clinic-mvp` requirement. The Laravel app already implements most of the workflow across booking, slot, payment, and availability code, but the end-to-end scheduling rules are still scattered and a few epic details, such as booking-facing doctor profile metadata and active-doctor-only slot discovery, are not yet explicit.

## What Changes
- Add a dedicated `clinic-consultation-scheduling` capability spec for active doctor discovery, recurring availability definition, slot generation, reservable slot search, 15-minute slot locking, and pending booking handoff into checkout.
- Document the design decisions for hybrid slot generation and transactional slot-lock and booking protection so implementation work stays aligned with the current Laravel patterns.
- Define implementation tasks to close the remaining scheduling gaps in doctor profile exposure, slot-search filtering, and scheduling-focused feature coverage.

## Impact
- Affected specs: `clinic-consultation-scheduling`
- Affected code: `app/Http/Controllers/BookingController.php`, `app/Http/Controllers/DoctorAvailabilityController.php`, `app/Http/Controllers/DoctorController.php`, `app/Http/Controllers/SlotController.php`, `app/Services/TimeSlotService.php`, `resources/js/Pages/Doctor/Availability.jsx`, `resources/js/Pages/Patient/BookConsultation.jsx`, `routes/web.php`, `tests/Feature/ClinicMvpTest.php`, `tests/Feature/DependablePlatformServicesTest.php`
