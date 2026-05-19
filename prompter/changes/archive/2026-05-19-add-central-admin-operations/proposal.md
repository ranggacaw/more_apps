# Change: Add Central Admin Operations

## Why
EPIC-007 requires a real admin back office, but the current implementation only provides `/admin/dashboard` with basic counts and recent bookings plus an admin package check-in endpoint. Administrators still cannot manage packages, inspect revenue and conversion metrics, broadcast WhatsApp updates, manage educational content, or manage users and roles without direct data access.

## What Changes
- Add capability specs for an admin operations dashboard with KPI overview and recent operational activity.
- Add capability specs for package and pricing administration plus revenue and conversion reporting based on transactional tables.
- Add capability specs for audited WhatsApp broadcast tooling and educational or site content management.
- Add capability specs for an admin user directory, role management, and authorized team-managed account provisioning while keeping `users.role` as the source of truth.
- Document the cross-cutting design decisions for new admin data models, queued broadcast delivery, and reporting scope.

## Impact
- Affected specs: `clinic-admin-operations-overview`, `clinic-admin-commerce-reporting`, `clinic-admin-communications-content`, `clinic-admin-user-administration`
- Affected code: `routes/web.php`, `resources/js/Layouts/AppLayout.jsx`, `resources/js/Pages/Admin/**/*`, `app/Http/Controllers/*Admin*.php`, `app/Models/{Package,Payment,User,Doctor,UserPackage}.php`, `database/migrations/*.php`, `app/Jobs/*.php`, `app/Services/WhatsAppService.php`, `tests/Feature/**/*.php`
