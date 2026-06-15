# Change: Add Booking Arrival Queue

## Why
The current clinic queue handles walk-in patients only, while confirmed in-clinic bookings remain outside the arrival-order workflow. Clinic staff need queue numbers to be assigned when patients arrive on the appointment day, not when the booking is created, so doctors and admins can operate from a shared same-day queue.

## What Changes
- Extend the existing `clinic_queue_entries` queue to support booking-linked arrivals in addition to walk-ins.
- Assign daily queue numbers only at check-in or walk-in creation time using a transactional allocator that prevents duplicate numbers.
- Update the admin queue page to show today's offline confirmed bookings that have not arrived, active queued patients from both sources, no-show handling, and daily summary counts.
- Update doctor queue behavior so doctors see the current and next in-clinic patient by queue order, then open the correct consultation workspace for either a booking-linked or walk-in queue entry.
- Keep optional public TV/QR queue displays and WhatsApp/SMS queue notifications out of scope for this change.

## Impact
- Affected specs: `clinic-queue-management`, `clinic-consultation-delivery`
- Affected code: `clinic_queue_entries` migration/model, `Booking` relationships/status handling, `AdminQueueController`, `DoctorDashboardController`, `resources/js/Pages/Admin/Queue.jsx`, `resources/js/Pages/Doctor/Dashboard.jsx`, `resources/js/Pages/Doctor/ConsultationWorkspace.jsx`, queue/booking feature tests
