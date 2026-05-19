## 1. Authentication Flow
- [x] 1.1 Replace the current patient email-verification onboarding flow in `routes/auth.php` and `app/Http/Controllers/Auth/` with an OTP-first registration and verification flow while preserving Laravel session login and logout behavior.
- [x] 1.2 Add the persistent verification data needed to issue, expire, and validate patient OTP codes, and wire that state into `app/Models/User.php` plus any new auth-specific service or job classes.

## 2. Delivery and UI
- [x] 2.1 Implement queued OTP generation and outbound delivery through the existing provider-oriented notification stack, including the WhatsApp service and any required job or notification classes.
- [x] 2.2 Replace the current email-verification page with an OTP verification experience and update the register and login pages so unverified patients are guided back into the OTP flow.

## 3. Validation
- [x] 3.1 Add feature coverage for registration validation, patient-only role assignment, OTP expiry and invalid-code handling, successful verification with automatic login, unverified login redirects, and logout behavior.
- [x] 3.2 Run `prompter validate add-patient-otp-auth --strict --no-interactive` and the relevant Laravel test suite, at minimum targeted auth tests and then `php artisan test` if the local database runtime is available.

## Post-Implementation
- [x] Update `AGENTS.md` in the project root if patient verification conventions or outbound-provider assumptions change.
