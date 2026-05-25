# Change: Move package catalog management from Admin to Doctor

## Why
Doctors are the clinical decision-makers who configure wellness packages, set pricing aligned with treatment plans, and manage the catalog that patients purchase from. Admin currently owns this task, but the domain responsibility belongs to doctors.

## What Changes
- **BREAKING**: Remove `Admin Package Catalog Management` requirement from `clinic-admin-commerce-reporting` and reassign package create, update, review, and deactivate operations to verified doctors.
- Add new `clinic-doctor-package-management` capability with a `Doctor Package Catalog Management` requirement.
- Move package routes from `/admin/packages` to `/doctor/packages` with `role:doctor` middleware.
- Update doctor workspace navigation to include a Packages destination.
- Update access control to reflect that doctors own package management routes and admins no longer access them.
- Update technical documentation to reflect the new route ownership.
- Admin retains revenue reporting and conversion analytics (no change to those requirements).

## Impact
- Affected specs: `clinic-admin-commerce-reporting`, `clinic-doctor-package-management` (new), `clinic-role-workspace-navigation`, `clinic-access-control`, `clinic-technical-documentation`
- Affected code: `routes/web.php`, `app/Http/Controllers/AdminPackageController.php` (rename to `DoctorPackageController`), `resources/js/Pages/Admin/Packages.jsx` (move to `resources/js/Pages/Doctor/Packages.jsx`), `resources/js/Layouts/AppLayout.jsx`, `resources/js/Layouts/DoctorLayout.jsx`, `docs/more_apps_docs.md`, `docs/cara_menggunakan_aplikasi.md`
