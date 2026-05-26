## Context
The current consultation flow is patient self-service only. A verified patient locks a slot, creates a pending booking, completes Midtrans checkout, and the payment callback confirms the booking and generates a joinable meeting link. Current booking and consultation records assume a registered patient user.

Admins now need a separate operational path for clinic-managed bookings, including non-registered guests who provide WhatsApp contact only. Online admin-assisted bookings need the doctor to provide a Google Meet URL because the doctor is the host.

## Goals / Non-Goals
- Goals: Allow verified admins to lock and confirm doctor slots for registered patients and guests.
- Goals: Support `offline` and `online` consultation modes for admin-assisted bookings.
- Goals: Require guest WhatsApp for guest bookings and preserve guest contact on the booking.
- Goals: Notify the assigned doctor when an online booking is waiting for a Google Meet link.
- Goals: Let the assigned doctor save a valid Google Meet URL and notify the patient or guest when it is ready.
- Non-Goals: Do not add Google Calendar or Google Meet API integration in this change.
- Non-Goals: Do not change the patient self-service Midtrans checkout flow.
- Non-Goals: Do not create login accounts for guest patients.
- Non-Goals: Do not add full offline payment accounting unless a later change explicitly requests it.

## Decisions
- Decision: Store guest booking details directly on `bookings` and make the registered patient link optional for admin-assisted guest bookings.
- Rationale: The user selected guest bookings instead of automatic account creation, and this avoids creating unverified accounts for one-off clinic contacts.
- Decision: Keep admin-assisted confirmation separate from Midtrans by confirming the booking and booking the slot inside the admin transaction.
- Rationale: Admin-assisted bookings represent clinic-managed or on-the-spot scheduling where the admin has authority to confirm immediately.
- Decision: Use `time_slots.locked_by_user_id` with the admin user's ID for admin-held locks, then clear it when the slot becomes booked.
- Rationale: This preserves the existing exclusive lock lifecycle without introducing a new lock table.
- Decision: Store `consultation_mode` on the booking with `offline` and `online` values.
- Rationale: Mode drives whether a meeting link is required and makes admin-created offline clinic bookings explicit in reporting and doctor views.
- Decision: Require doctor-supplied Google Meet URLs for online admin-assisted bookings and validate the URL host instead of creating meetings through an external API.
- Rationale: The doctor is the host and can create the room, while avoiding a new Google integration dependency.
- Decision: Reuse the existing queued booking notification job and provider services for doctor link requests and patient or guest meeting-link notifications.
- Rationale: Current notification delivery already uses queueable jobs, email, and WhatsApp service boundaries.

## Risks / Trade-offs
- Nullable patient links require careful updates anywhere code assumes `booking->patient` is always present.
- Guest bookings will not appear in a patient dashboard or medical record portal because no patient account exists.
- Admin-confirmed bookings without payment records should not be counted as Midtrans-paid revenue or consultation-credit awards.
- Doctor workload and consultation completion must display guest identity from booking contact fields when no registered patient exists.

## Migration Plan
1. Add nullable booking fields for admin source, guest contact, consultation mode, booked-by admin, and meeting-link request timestamps.
2. Allow `bookings.user_id` and consultation patient references to be nullable only where needed for guest bookings.
3. Backfill existing bookings as self-service online bookings with existing registered patients.
4. Update read models and UI payloads to resolve display patient identity from either the registered user or guest fields.
5. Keep rollback safe by removing only the new admin-assisted fields after guest booking data is no longer needed.

## Open Questions
- None for this proposal. Offline payment accounting and guest account conversion are intentionally deferred.
