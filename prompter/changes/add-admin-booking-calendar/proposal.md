# Change: Add Admin Booking Calendar

## Why
Admins currently create bookings and can monitor recent activity or same-day queue arrivals, but they do not have a dedicated calendar-style view for seeing all listed patients on a busy day. A separate calendar page helps staff quickly understand who is booked by day, week, or month without mixing that visibility into the booking creation form or queue workflow.

## What Changes
- Add a dedicated admin calendar page at `/admin/calendar` for verified admins.
- Provide month, week, and day views with query-string state and a selected-date patient list.
- Show booking counts per calendar date and detailed booked-patient rows when a date is selected.
- Include patient identity, contact, doctor, schedule, consultation mode, booking status, guest/registered marker, queue state when present, and a Review link.
- Add admin navigation and dashboard entry points for the calendar.
- Keep arrival check-in, no-show, queue numbers, and rescheduling outside this first version.

## Impact
- Affected specs: `clinic-consultation-scheduling`, `clinic-role-workspace-navigation`, `clinic-admin-operations-overview`
- Affected code: `routes/web.php`, new admin calendar controller, new Inertia calendar page, admin layout navigation, admin dashboard shortcut, admin calendar feature tests
- Data model: no schema changes
