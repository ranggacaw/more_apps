# Change: Align clinic specs with documented operational details

## Why
The current Prompter specs already cover most of the clinic platform, but several repo-backed behaviors from `docs/more_apps_docs.md`, `AGENTS.md`, and the implemented Laravel flows remain implicit or underspecified. Tightening those gaps keeps future work aligned with the documented OTP, admin operations, checkout pricing, and weekly reminder behavior already present in the codebase.

## What Changes
- Clarify patient self-registration and OTP verification as a WhatsApp-driven `/verify-otp` flow for self-registered patients.
- Tighten admin broadcast requirements around the approved audience scopes and per-recipient delivery audit persistence.
- Tighten educational content requirements around managed assets and public home-page publishing.
- Tighten admin user-management requirements around direct verification controls and preserved inactive doctor profiles during role changes.
- Clarify consultation checkout initialization as a fixed `clinic.consultation_fee` handoff.
- Clarify weekly reminder deduplication storage for active program engagement reminders.

## Impact
- Affected specs: `clinic-patient-authentication`, `clinic-admin-communications-content`, `clinic-admin-user-administration`, `clinic-service-integrations`, `clinic-background-automation`
- Affected code: `routes/auth.php`, `app/Http/Controllers/Auth/RegisteredUserController.php`, `app/Http/Controllers/Auth/VerifyOtpController.php`, `app/Http/Controllers/AdminBroadcastController.php`, `app/Http/Controllers/AdminContentController.php`, `routes/web.php`, `app/Http/Controllers/AdminUserController.php`, `app/Http/Controllers/PaymentController.php`, `app/Services/ProgramReminderService.php`
