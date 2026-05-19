# Change: Add Patient OTP Authentication

## Why
EPIC-001 requires patient self-registration, OTP verification, and session-based login/logout, but the current Laravel auth flow still uses email-link verification. The platform already enforces verified access on operational routes, so the missing work is defining how patient accounts become verified through the documented OTP-first onboarding path.

## What Changes
- Add a dedicated capability spec for patient self-registration, OTP verification, and session-based patient login/logout.
- Modify access-control requirements so self-registered patients are redirected to an OTP verification experience until they complete verification.
- Modify background-automation requirements so patient onboarding OTP delivery is explicitly queued through the configured outbound provider flow.

## Impact
- Affected specs: `clinic-patient-authentication`, `clinic-access-control`, `clinic-background-automation`
- Affected code: `routes/auth.php`, `app/Http/Controllers/Auth/*.php`, `app/Models/User.php`, `app/Jobs/*Otp*.php`, `app/Services/WhatsAppService.php`, `resources/js/Pages/Auth/*.jsx`, `database/migrations/*.php`, `tests/Feature/Auth/*.php`, `tests/Feature/DependablePlatformServicesTest.php`
