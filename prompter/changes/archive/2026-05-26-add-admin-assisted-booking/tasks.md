## 1. Data Model
- [x] 1.1 Add a migration for admin-assisted booking fields on `bookings`: nullable `user_id` support for guest bookings, `booked_by_admin_id`, `booking_source`, `consultation_mode`, `guest_patient_name`, `guest_whatsapp`, `meeting_link_requested_at`, and `meeting_link_submitted_at`.
- [x] 1.2 Update consultation-related schema where needed so guest bookings can be completed without a registered `users` row while registered-patient records keep their existing links.
- [x] 1.3 Update `App\Models\Booking`, related factories, and payload helpers to resolve patient display/contact data from either a registered patient or guest booking fields.

## 2. Admin Booking Workflow
- [x] 2.1 Add admin routes under `/admin/bookings` for the booking assistance page, admin slot discovery, admin slot locking, and immediate booking confirmation.
- [x] 2.2 Implement an admin booking controller that reuses `TimeSlotService`, active-doctor filtering, and transactional slot locking/booking rules.
- [x] 2.3 Validate registered-patient bookings by selected patient user and validate guest bookings by required guest name and WhatsApp number.
- [x] 2.4 Confirm admin-assisted bookings immediately by marking the booking `confirmed`, marking the slot `booked`, clearing lock fields, and skipping Midtrans payment creation.
- [x] 2.5 Add `resources/js/Pages/Admin/Bookings.jsx` and an admin navigation link for searching doctors/slots, selecting registered or guest patient details, choosing offline or online mode, locking slots, and confirming bookings.

## 3. Doctor Meeting Link Workflow
- [x] 3.1 Add a doctor-owned endpoint to save or update the Google Meet link for the doctor's own confirmed online booking.
- [x] 3.2 Validate doctor-submitted meeting links as HTTPS Google Meet URLs and reject updates from unrelated doctors.
- [x] 3.3 Surface missing-link state in `Doctor/Dashboard.jsx`, `Doctor/Consultations.jsx`, and `Doctor/ConsultationWorkspace.jsx` for online admin-assisted bookings.
- [x] 3.4 Block completion of online admin-assisted consultations until the required Google Meet link exists.

## 4. Notifications
- [x] 4.1 Extend `SendBookingNotificationJob` with doctor link-request and meeting-link-ready notification types.
- [x] 4.2 Queue a doctor notification when an admin confirms an online booking without a meeting link.
- [x] 4.3 Queue patient or guest WhatsApp notification when the doctor saves the Google Meet link, using email only for registered patients with an email address.
- [x] 4.4 Ensure offline admin-assisted bookings queue the appropriate patient or guest confirmation message without requesting a meeting link.

## 5. Validation
- [x] 5.1 Add feature tests for admin-only access to admin booking assistance routes.
- [x] 5.2 Add feature tests for registered-patient admin bookings, guest admin bookings with required WhatsApp, and slot exclusivity.
- [x] 5.3 Add feature tests proving admin-assisted bookings bypass Midtrans while self-service patient checkout still uses Midtrans.
- [x] 5.4 Add feature tests for doctor Google Meet link validation, doctor notification dispatch, patient or guest link notification, and completion blocking while the link is missing.
- [x] 5.5 Run the relevant Laravel test suite, such as `php artisan test --filter=AdminOperationsTest` plus any new booking/link tests.

## Post-Implementation
- [x] Update `AGENTS.md` with any new durable route, domain, or workflow notes introduced by this change.
