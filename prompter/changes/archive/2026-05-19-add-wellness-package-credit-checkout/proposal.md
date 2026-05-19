# Change: Add wellness package checkout with consultation credit

## Why
EPIC-005 requires the clinic to convert completed consultations into package purchases by applying the paid consultation fee as a single-use credit. The current system can complete consultations, send package-selection follow-up messages, and activate user packages, but it does not yet track consultation credit, expose package pricing with credit applied, or process package checkout and settlement.

## What Changes
- Add a new `clinic-package-commerce` capability for patient package browsing, price breakdown, eligibility validation, and credit-backed checkout.
- Extend the data model to track consultation credit balance, expiry, source payment linkage, and package-payment metadata needed to audit credit use.
- Extend payment orchestration to initialize discounted package payments, reconcile funded package callbacks idempotently, and activate zero-balance package purchases immediately without Midtrans.
- Extend queued notifications so both funded and zero-balance package activations send the patient-facing package activation confirmation.

## Impact
- Affected specs: `clinic-package-commerce` (new), `clinic-data-foundation`, `clinic-service-integrations`, `clinic-background-automation`
- Affected code: likely new patient package routes/controller/page, `app/Http/Controllers/PaymentController.php`, `app/Services/PackageService.php`, `app/Models/{User,Payment,Booking,UserPackage}.php`, migrations for `users` and `payments`, notification jobs, and related feature tests
