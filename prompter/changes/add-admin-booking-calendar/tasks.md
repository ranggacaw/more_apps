## 1. Routing and Backend Data
- [ ] 1.1 Register `GET /admin/calendar` in the existing verified admin route group with route name `admin.calendar.index` in `routes/web.php`.
- [ ] 1.2 Create `app/Http/Controllers/AdminBookingCalendarController.php` as an invokable Inertia controller.
- [ ] 1.3 Validate calendar query inputs: `view` (`month`, `week`, `day`), `date`, optional `doctor_id`, optional `status`, and optional `mode`.
- [ ] 1.4 Calculate the visible date range for the selected view and default the selected date to today.
- [ ] 1.5 Query `Booking` records by related `time_slots.start_time` within the visible range and eager-load `patient`, `doctor.user`, `slot`, and `queueEntry`.
- [ ] 1.6 Map Inertia props for calendar days, selected-date bookings, active doctors, summary counts, and active filters using existing booking identity helpers.

## 2. Frontend Calendar UI
- [ ] 2.1 Create `resources/js/Pages/Admin/BookingCalendar.jsx` using `AdminLayout`, `Head`, existing formatting helpers, and the project visual style.
- [ ] 2.2 Add month/week/day view controls and previous/next/today navigation that update Inertia query params.
- [ ] 2.3 Render month calendar cells with date number, today/selected state, and booking-count badges.
- [ ] 2.4 Render week and day agenda rows ordered by appointment time.
- [ ] 2.5 Render a selected-date patient list with time, patient name, contact, doctor, mode, status, guest/registered type, queue status, and Review link.
- [ ] 2.6 Add clean empty states for days and ranges with no bookings.

## 3. Navigation and Dashboard Entry
- [ ] 3.1 Add a Calendar item near Bookings and Queue in `resources/js/Layouts/AdminLayout.jsx`.
- [ ] 3.2 Add a dashboard shortcut to the new calendar in `resources/js/Pages/Admin/Dashboard.jsx`.
- [ ] 3.3 Keep the existing booking creation page at `/admin/bookings` unchanged as the booking creation workflow.

## 4. Tests and Validation
- [ ] 4.1 Add `tests/Feature/AdminBookingCalendarTest.php` covering verified admin access and Inertia component props.
- [ ] 4.2 Add authorization tests proving patient and doctor users cannot access `/admin/calendar`.
- [ ] 4.3 Add range filtering tests proving visible-range bookings are included and out-of-range bookings are excluded.
- [ ] 4.4 Add payload tests for registered patients, guest patients, and queue-linked bookings with queue number/status.
- [ ] 4.5 Run `php artisan test --filter=AdminBookingCalendarTest`.
- [ ] 4.6 Run `npm run build`.

## Post-Implementation
- [ ] Update `AGENTS.md` with the new `/admin/calendar` route and behavior.
