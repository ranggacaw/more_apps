## 1. Payment Checkout Alignment
- [x] 1.1 Update `app/Http/Controllers/PaymentController.php`, `app/Models/Payment.php`, and any required payment migration or configuration files so consultation checkout always initializes against the approved fixed Rp 500.000 fee with a unique Midtrans order ID per attempt.
- [x] 1.2 Ensure `app/Http/Controllers/PaymentController.php` and `resources/js/Pages/Patient/Checkout.jsx` expose the booking summary, payment metadata, and Snap or demo token data needed to continue payment without confirming the booking client-side.

## 2. Midtrans Outcome Handling
- [x] 2.1 Update `app/Services/MidtransService.php` and `app/Http/Controllers/PaymentController.php` so consultation payment initialization, signature validation, and amount validation align with the documented Midtrans workflow.
- [x] 2.2 Keep webhook handling authoritative and idempotent in `app/Http/Controllers/PaymentController.php`, including explicit success, pending, denied, cancelled, expired, and failure reconciliation for payment, booking, and slot records.

## 3. Fulfillment and Notifications
- [x] 3.1 Ensure successful consultation payment confirmation creates meeting access through `app/Services/MeetingLinkService.php` before the booking is committed as confirmed.
- [x] 3.2 Update `app/Jobs/SendBookingNotificationJob.php`, `app/Services/EmailNotificationService.php`, and `app/Services/WhatsAppService.php` so queued confirmation messages include the consultation access details required after payment success.

## 4. Local Development and Regression Coverage
- [x] 4.1 Keep `resources/js/Pages/Patient/Checkout.jsx`, `routes/web.php`, and the consultation payment controller flow aligned so local demo success, pending, and failure simulations exercise the same server-side transitions in non-production only.
- [x] 4.2 Expand `tests/Feature/DependablePlatformServicesTest.php` and any adjacent payment-focused tests for checkout initialization, webhook signature and amount validation, pending callbacks, failed callbacks, idempotency, meeting-link generation, and queued confirmation dispatch.

## 5. Validation
- [x] 5.1 Run the affected Laravel feature tests and `prompter validate add-consultation-payment-capture --strict --no-interactive` before requesting implementation approval.

## Post-Implementation
- [x] Update `AGENTS.md` and `docs/more_apps_docs.md` if the implemented consultation payment rules or operator-facing notes change from the current project guidance.
