## 1. Data Model And Queue Allocation
- [x] 1.1 Add queue source/link/order fields to `clinic_queue_entries` for `source_type`, nullable `booking_id`, queue date, numeric daily sequence, and any timestamps needed for called/no-show display.
- [x] 1.2 Add database constraints/indexes for one queue entry per booking and unique daily queue sequence ordering.
- [x] 1.3 Backfill existing queue entries as walk-ins with queue dates derived from existing timestamps.
- [x] 1.4 Replace count-based queue-number generation with a transactional allocator shared by walk-in creation and booking check-in.

## 2. Admin Arrival Queue
- [x] 2.1 Extend admin queue data to include today's confirmed in-clinic bookings that have no queue entry and are not completed or no-show.
- [x] 2.2 Add an admin check-in action for eligible same-day bookings that creates a booking-linked queue entry and assigns the next daily queue number.
- [x] 2.3 Add an admin no-show action for not-yet checked-in same-day bookings without assigning a queue number.
- [x] 2.4 Update walk-in creation to use the shared allocator and capture queue source consistently.
- [x] 2.5 Update `Admin/Queue.jsx` to show not-arrived bookings, active queued patients from both sources, summary counts, and the existing polling behavior.

## 3. Doctor Queue And Consultation Flow
- [x] 3.1 Update doctor queue payloads to show the current called/in-consultation patient and next waiting patient by queue order for the assigned doctor.
- [x] 3.2 Add guarded doctor actions to call/start/open eligible queue entries without allowing doctors to access other doctors' patients.
- [x] 3.3 Route booking-linked queue entries into the scheduled booking consultation workspace with queue context.
- [x] 3.4 Ensure completing a booking-linked queue consultation stores booking consultation data, records queue traceability, and marks both the booking and queue entry completed.
- [x] 3.5 Preserve the existing walk-in queue-originated consultation and billing handoff behavior.

## 4. Validation
- [x] 4.1 Add feature tests for booking check-in, duplicate check-in rejection, no-show handling, and queue-number assignment by arrival order.
- [x] 4.2 Add a concurrency-oriented test or database constraint assertion for duplicate daily queue numbers.
- [x] 4.3 Add doctor-flow tests for call/start/open/complete behavior for booking-linked queue entries and authorization failures for other doctors.
- [x] 4.4 Run the relevant Laravel feature tests, including the existing walk-in queue tests.

## Post-Implementation
- [x] Update `AGENTS.md` with the new booking arrival queue rules after implementation is complete.
