# Change: Add admin-assisted consultation booking

## Why
Admins need to reserve and confirm doctor consultation slots for clinic-managed cases, including guests who only provide a WhatsApp number. Online consultations also need a doctor-hosted Google Meet link so patients can join without administrator handoff at consultation time.

## What Changes
- Add an admin booking assistance workflow for active doctors and available slots.
- Let admins lock and immediately confirm bookings for either registered patients or guest patients, with guest WhatsApp required.
- Support offline clinic consultations and online consultations from the admin workflow without requiring Midtrans checkout.
- Store admin-assisted booking metadata, guest contact fields, consultation mode, and meeting-link request state.
- Notify doctors when an online booking needs a Google Meet link, let the assigned doctor save the link, and notify the patient or guest when the link is ready.
- Keep the existing patient self-service booking, slot locking, checkout, and Midtrans callback flow unchanged.

## Impact
- Affected specs: `clinic-access-control`, `clinic-consultation-scheduling`, `clinic-consultation-delivery`, `clinic-data-foundation`, `clinic-service-integrations`
- Affected code: booking and consultation migrations/models, admin routes/controllers/pages, doctor consultation controllers/pages, booking notification job, reminder/notification services, feature tests
