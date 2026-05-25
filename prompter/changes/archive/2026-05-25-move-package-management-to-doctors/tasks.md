## 1. Backend route and controller migration
- [x] 1.1 Rename `AdminPackageController` to `DoctorPackageController` (or create new controller) and keep the same `index`, `store`, `update` methods
- [x] 1.2 Move package routes from the `admin` middleware group to the `doctor` middleware group in `routes/web.php` with `doctor.` name prefix and `/doctor/packages` URI
- [x] 1.3 Update controller Inertia render path from `Admin/Packages` to `Doctor/Packages`

## 2. Frontend page migration
- [x] 2.1 Move `resources/js/Pages/Admin/Packages.jsx` to `resources/js/Pages/Doctor/Packages.jsx`
- [x] 2.2 Update route references inside the page from `admin.packages.*` to `doctor.packages.*`
- [x] 2.3 Update page title from "Admin Packages" to "Packages" or "Doctor Packages"

## 3. Navigation layout updates
- [x] 3.1 Remove `admin.packages.index` entry from `resources/js/Layouts/AppLayout.jsx` admin navigation section
- [x] 3.2 Add `doctor.packages.index` entry to `resources/js/Layouts/AppLayout.jsx` doctor navigation section
- [x] 3.3 Add a Packages item to `resources/js/Layouts/DoctorLayout.jsx` navigation array

## 4. Documentation updates
- [x] 4.1 Update `docs/more_apps_docs.md` route table to reflect `/doctor/packages` routes with `DoctorPackageController`
- [x] 4.2 Update `docs/more_apps_docs.md` primary page files list to replace `Admin/Packages.jsx` with `Doctor/Packages.jsx`
- [x] 4.3 Update `docs/cara_menggunakan_aplikasi.md` admin flow to remove package management step and add it to the doctor flow

## 5. Verification
- [x] 5.1 Verify a doctor user can access `/doctor/packages` and perform create, update, and deactivate actions
- [x] 5.2 Verify an admin user cannot access `/doctor/packages` (403)
- [x] 5.3 Verify the admin dashboard still displays package-related KPIs in the read-only overview
- [x] 5.4 Verify the patient package catalog at `/patient/packages` still fetches active packages correctly

## Post-Implementation
- [x] Update `AGENTS.md` in the project root: change `/admin/packages` references to `/doctor/packages`, update domain rules about package management ownership, and update Key Routes section
