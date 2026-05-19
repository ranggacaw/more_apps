# EPIC Breakdown: MORE Aesthetic and Wellness Centre

## Executive Summary
- Total EPICs identified: 8
- Complexity distribution: High 3, Medium 5, Low 0
- Size distribution: XL 1, L 5, M 2, S 0
- Key dependencies identified: EPIC-008 is the foundation for all delivery. The core patient value stream progresses from EPIC-001 to EPIC-006, while EPIC-007 depends on operational data created by booking, payment, and package flows.
- Coverage gaps or conflicts: 4 major gaps and 4 document conflicts were identified. The most material issues are status-enum casing mismatches, inconsistent slot route naming, missing consultation-credit award logic in the payment success sample, and referenced dashboard entities that do not yet exist in the schema.

## Source Assumptions
- `docs/more_apps_docs.md` is treated as a combined FSD and TDD because no separate FSD or TDD files were supplied.
- No standalone wireframes were provided. UI traceability uses Section 6 dashboard/component references and Section 9 page/component paths as wireframe proxies.
- When narrative flow and code snippets conflict, the functional flow sections are treated as the authority for scope.
- Requirement IDs in this folder are synthesized for planning traceability because the source document does not define formal requirement IDs.

## EPIC Index
| EPIC ID | Title | Complexity | Dependencies | File |
|---------|-------|------------|--------------|------|
| EPIC-001 | Register Patient Accounts Securely | M | EPIC-008 | [EPIC-001-register-patient-accounts-securely.md](./EPIC-001-register-patient-accounts-securely.md) |
| EPIC-002 | Schedule Consultation Appointments Reliably | L | EPIC-001, EPIC-008 | [EPIC-002-schedule-consultation-appointments-reliably.md](./EPIC-002-schedule-consultation-appointments-reliably.md) |
| EPIC-003 | Capture Consultation Payments Automatically | L | EPIC-001, EPIC-002, EPIC-008 | [EPIC-003-capture-consultation-payments-automatically.md](./EPIC-003-capture-consultation-payments-automatically.md) |
| EPIC-004 | Complete Patient Consultations Consistently | M | EPIC-002, EPIC-003, EPIC-008 | [EPIC-004-complete-patient-consultations-consistently.md](./EPIC-004-complete-patient-consultations-consistently.md) |
| EPIC-005 | Sell Wellness Packages with Credit | L | EPIC-003, EPIC-004, EPIC-008 | [EPIC-005-sell-wellness-packages-with-credit.md](./EPIC-005-sell-wellness-packages-with-credit.md) |
| EPIC-006 | Guide Patient Programs Continuously | L | EPIC-004, EPIC-005, EPIC-008 | [EPIC-006-guide-patient-programs-continuously.md](./EPIC-006-guide-patient-programs-continuously.md) |
| EPIC-007 | Administer Clinic Operations Centrally | L | EPIC-002, EPIC-003, EPIC-005, EPIC-008 | [EPIC-007-administer-clinic-operations-centrally.md](./EPIC-007-administer-clinic-operations-centrally.md) |
| EPIC-008 | Operate Platform Services Dependably | XL | None | [EPIC-008-operate-platform-services-dependably.md](./EPIC-008-operate-platform-services-dependably.md) |

## Dependency Map
```text
EPIC-008 -> EPIC-001 -> EPIC-002 -> EPIC-003 -> EPIC-004 -> EPIC-005 -> EPIC-006
EPIC-008 -> EPIC-007
EPIC-002 -> EPIC-007
EPIC-003 -> EPIC-007
EPIC-005 -> EPIC-007
```

## Traceability Matrix
| Requirement ID | FSD Section | TDD Component | Wireframe | EPIC |
|----------------|-------------|---------------|-----------|------|
| REQ-001 | 2.1 Register & Login | Auth stack, `users` schema, `AuthController`, auth routes | `Auth/Register.jsx` proxy | EPIC-001 |
| REQ-002 | 2.1 Register & Login | OTP validation flow, verified middleware, `SendOtpJob` | `Auth/VerifyOtp.jsx` proxy | EPIC-001 |
| REQ-003 | 2.1 Register & Login | Session auth, login/logout routes | `Auth/Login.jsx` proxy | EPIC-001 |
| REQ-004 | 2.2 Booking Konsultasi | `DoctorController@index`, `doctors` schema | `Patient/BookConsultation.jsx` proxy | EPIC-002 |
| REQ-005 | 4.1 Alur Slot | `doctor_availabilities`, slot generation command, `AvailabilityController` | `Doctor/Availability.jsx` proxy | EPIC-002 |
| REQ-006 | 2.2 Booking Konsultasi, 4.1 Alur Slot | `SlotController@available`, `SlotController@lock`, `time_slots` schema | `BookingCalendar.jsx` proxy | EPIC-002 |
| REQ-007 | 2.2 Booking Konsultasi | `BookingController@store`, `bookings` schema, checkout route | `Patient/Checkout.jsx` proxy | EPIC-002 |
| REQ-008 | 2.3 Payment & Konfirmasi, 3.1 Inisialisasi Transaksi | `PaymentController@initConsultation`, `payments` schema, Midtrans config | `PaymentButton.jsx` proxy | EPIC-003 |
| REQ-009 | 2.3 Payment & Konfirmasi, 3.3 Webhook Handler | webhook route, signature validation, booking and slot reconciliation | Checkout success and pending states proxy | EPIC-003 |
| REQ-010 | 2.3 Payment & Konfirmasi, 4.2 Release Slot | `ZoomService`, WA and email jobs, reminder scheduler | Notification UX proxy not provided | EPIC-003 |
| REQ-011 | 2.4 Pasca Konsultasi -> Pilih Paket | `ConsultationController@complete`, `consultations` schema | `Doctor/Dashboard.jsx` proxy | EPIC-004 |
| REQ-012 | 5.1 Logika | `users.consultation_credit`, `credit_expires_at`, payment success handling | Package pricing summary proxy | EPIC-005 |
| REQ-013 | 2.4 Pasca Konsultasi -> Pilih Paket, 5.2 Controller | `PackageController@withCredit`, `packages` schema | `Patient/Packages.jsx` proxy | EPIC-005 |
| REQ-014 | 2.4 Pasca Konsultasi -> Pilih Paket, 3.3 Webhook Handler | `PaymentController@initPackage`, package payment branch, `user_packages` schema | `Patient/Packages.jsx` proxy | EPIC-005 |
| REQ-015 | 6.1 Dashboard Pasien | `PatientDashboardController`, `user_packages`, `notifications`, `user_health_data` | `Patient/Dashboard.jsx` proxy | EPIC-006 |
| REQ-016 | 6.1 Dashboard Pasien | `CheckInController`, `check_ins` schema, `ProgressChart` | `Patient/CheckIn.jsx`, `CheckInForm.jsx` proxies | EPIC-006 |
| REQ-017 | 6.2 Dashboard Dokter | `DoctorPatientController`, `DoctorCheckInController`, `check_ins`, `user_packages` | `Doctor/PatientDetail.jsx` proxy | EPIC-006 |
| REQ-018 | 6.3 Dashboard Admin | `AdminDashboardController`, `PackageAdminController`, `UserAdminController` | `Admin/Dashboard.jsx` proxy | EPIC-007 |
| REQ-019 | 6.3 Dashboard Admin | `ReportController`, `BroadcastWaJob`, `payments`, conversion analytics inputs | `Admin/Reports.jsx` proxy | EPIC-007 |
| REQ-020 | 1. Tech Stack, 4.2 Release Slot, 7. Database Schema, 8. Routes & Controller | middleware, queue, scheduler, storage, service classes, env config | No wireframe expected | EPIC-008 |

## Gaps & Recommendations
1. **Identified Gaps:** No separate FSD, TDD, or wireframes were supplied. Section 6 references `user_health_data`, `screenings`, `notifications`, `roles`, and `educational_content`, but these entities are not defined in the schema or route inventory. Package payment initiation, PDF generation behavior, and meeting-provider fallback rules are also underspecified.
2. **Conflicts Found:** Status values are uppercase in flows and code samples but lowercase in the schema. Narrative booking endpoints use `/doctors`, `/slots`, and `/slots/lock`, while the routes section defines `/api/doctors`, `/api/slots`, and `/api/slots/lock`. Consultation credit is required by the deduction logic but is not assigned in the consultation-payment success sample. The payment example uses `resources/js/Pages/Checkout.jsx`, while the folder structure places the page under `resources/js/Pages/Patient/Checkout.jsx`.
3. **Recommendations:** Normalize route and enum naming before story breakdown. Add missing schemas and controllers for the referenced dashboard modules. Confirm where consultation credit is awarded and how duplicate webhooks and retries are handled. Produce wireframes or page-level UX specs for dashboard-heavy areas before sprint decomposition.

## Verification Checklist
- [x] 100% of documented functional requirements in `docs/more_apps_docs.md` are covered
- [x] All documented technical components map to at least one EPIC
- [ ] No orphaned wireframe screens
- [x] Dependency chain is logical and achievable
- [x] Each EPIC is independently valuable
- [x] Complexity assessments are consistent
- [x] Traceability is complete and accurate for the provided source package

Wireframe validation remains partial because no standalone wireframe artifact was provided.
