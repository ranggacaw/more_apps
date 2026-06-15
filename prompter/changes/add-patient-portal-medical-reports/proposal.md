# Change: Add patient portal medical reports

## Why
Patients with active care programs need secure read-only access to their own visit reports, progress trends, and next-control guidance without asking clinic staff for every update. The current implementation explicitly blocks patient login even though existing specs already describe patient-facing program and medical-record workspaces, so the authentication and reporting policy needs to be realigned before implementation.

## What Changes
- Re-enable authenticated `patient` accounts while keeping patient self-registration unavailable and staff operational routes restricted to verified `doctor`, `admin`, and `super_admin` users.
- Automatically provision patient accounts from staff-entered patient identity data when an account is appropriate, using phone number as the primary login identifier and forcing a password change on first login.
- Add patient password recovery through the configured messaging channel for registered patient phone numbers.
- Add patient-facing portal navigation for dashboard, progress, and report history screens.
- Extend consultation/session completion into finalized patient-visible medical reports with metrics, doctor notes, patient instructions, next-control date, and attachments where available.
- Notify patients when an account is created and when a finalized report becomes available.

## Impact
- Affected specs: `clinic-patient-authentication`, `clinic-access-control`, `clinic-admin-user-administration`, `clinic-consultation-delivery`, `clinic-patient-medical-records`, `clinic-role-workspace-navigation`
- Affected code: `routes/auth.php`, `routes/web.php`, `app/Http/Controllers/Auth/AuthenticatedSessionController.php`, `app/Http/Controllers/AdminUserController.php`, patient portal controllers/pages to be added, consultation completion flows, notification jobs/services, user schema/migrations, policy/middleware tests
- Policy impact: This intentionally reverses the staff-only patient-login removal documented by the current code and `clinic-patient-authentication` spec, while preserving the removal of public patient self-registration.
