## 1. Authentication And Access
- [ ] 1.1 Add or restore schema support for `users.role = patient` and a `must_change_password` flag while preserving existing staff roles and verification behavior.
- [ ] 1.2 Update login handling so verified staff users still reach staff dashboards and verified patient users reach the patient portal.
- [ ] 1.3 Add first-login password-change enforcement for patient accounts before any patient portal content is accessible.
- [ ] 1.4 Add patient phone-based password recovery using the configured notification provider and rate limiting.
- [ ] 1.5 Add authorization tests proving patients cannot access doctor, admin, finance, queue, or staff profile-management routes.

## 2. Automatic Patient Account Provisioning
- [ ] 2.1 Update admin user/patient creation flow to support patient accounts with phone-first identity and optional account opt-out for patients without usable phone access.
- [ ] 2.2 Add account auto-provisioning when staff-entered patient identity data includes an eligible phone number and no matching patient account already exists.
- [ ] 2.3 Send queued account-created notifications containing the login identifier and temporary credential without logging sensitive values.
- [ ] 2.4 Handle duplicate phone numbers and phone edits by linking to the existing patient account or updating the account login identifier without creating duplicates.

## 3. Patient Portal And Reports
- [ ] 3.1 Add patient portal route group, layout/navigation, and dashboard entry for active package progress, next-control guidance, and latest finalized report summary.
- [ ] 3.2 Add patient report history and report detail pages that expose only the signed-in patient's finalized, patient-visible session reports.
- [ ] 3.3 Add progress metric views for weight, BMI, waist, hip, and other available slimming/session measurements from finalized reports and weekly check-ins.
- [ ] 3.4 Ensure patient-facing asset links use the existing secure clinic asset delivery pattern and deny cross-patient access.

## 4. Session Report Capture
- [ ] 4.1 Extend consultation/session completion to capture patient-visible instructions, next-control date, and finalized report status alongside existing notes and slimming metrics.
- [ ] 4.2 Allow staff draft/input behavior only where authorized, and require doctor or super-admin finalization before reports become patient-visible.
- [ ] 4.3 Queue a patient notification when a report transitions to finalized and visible.
- [ ] 4.4 Preserve existing doctor medical-record and finance/billing behavior while adding patient-visible report fields.

## 5. Validation
- [ ] 5.1 Add feature tests for auto-provisioning, duplicate phone handling, first-login password rotation, and patient password recovery.
- [ ] 5.2 Add feature tests for patient portal ownership boundaries, finalized-only report visibility, progress metrics, and secure attachment access.
- [ ] 5.3 Run the project test suite or targeted Laravel/Inertia tests covering authentication, admin users, consultation completion, patient records, and notifications.
- [ ] 5.4 Update root `AGENTS.md` notes after implementation to reflect the restored patient portal policy.
