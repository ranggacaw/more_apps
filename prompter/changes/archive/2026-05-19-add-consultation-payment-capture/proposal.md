# Change: Add Consultation Payment Capture

## Why
EPIC-003 needs payment-capture requirements that are more explicit than the current high-level scheduling and integration specs. The Laravel app already has consultation checkout, Midtrans Snap token creation, webhook handling, meeting-link generation, and queued confirmation work, but the specs do not yet fully define fixed-fee checkout initialization, client-side Snap handoff behavior, pending and failed callback handling, or the expectation that confirmed consultations include meeting access and confirmation delivery.

## What Changes
- Tighten the pending-booking-to-checkout handoff so consultation checkout is only exposed for the patient's eligible pending booking and remains unconfirmed until the authoritative payment callback arrives.
- Expand the payment and integration requirements to cover unique consultation order IDs, fixed Rp 500.000 checkout initialization, Snap token handoff, client-side Snap event handling, signature and amount validation, terminal-state reconciliation, and duplicate webhook idempotency.
- Clarify the data and automation expectations for consultation payment attempts, meeting-link creation, and queued WhatsApp and email confirmations after successful payment.
- Define implementation tasks for the controller, service, UI, notification, route, and test changes needed to align the app with EPIC-003.

## Impact
- Affected specs: `clinic-consultation-scheduling`, `clinic-data-foundation`, `clinic-service-integrations`, `clinic-background-automation`
- Affected code: `app/Http/Controllers/PaymentController.php`, `app/Services/MidtransService.php`, `app/Services/MeetingLinkService.php`, `app/Jobs/SendBookingNotificationJob.php`, `app/Models/Payment.php`, `resources/js/Pages/Patient/Checkout.jsx`, `routes/web.php`, `tests/Feature/DependablePlatformServicesTest.php`, `docs/more_apps_docs.md`
