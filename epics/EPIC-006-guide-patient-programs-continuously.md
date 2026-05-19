# EPIC-006: Guide Patient Programs Continuously

## Business Value Statement
This EPIC keeps patients engaged after purchase by making their program status, progress, and weekly touchpoints visible in one place. It also gives doctors the information they need to review adherence and adjust programs over time.

## Description
Deliver the patient engagement and ongoing care workspace, including the patient dashboard, package and meal-plan visibility, weekly check-ins, progress charts, notifications, doctor review of active patients, check-in review, and program adjustments. The experience should support continuous monitoring across the life of an active package.

## Source Traceability
| Document | Reference | Section/Page |
|----------|-----------|--------------|
| FSD | Patient dashboard, weekly check-ins, progress tracking, doctor review of active patients and program adjustments | `more_apps_docs.md` 6.1, 6.2 |
| TDD | `CheckInController`, `DoctorPatientController`, `DoctorCheckInController`, `check_ins`, `user_packages`, storage support for photos and PDFs | `more_apps_docs.md` 1, 7.1, 8.1, 9 |
| Wireframe | Not provided; inferred from `Patient/Dashboard.jsx`, `Patient/CheckIn.jsx`, `Doctor/PatientDetail.jsx`, `CheckInForm.jsx`, `ProgressChart.jsx` | `more_apps_docs.md` 9 |

## Scope Definition
| In Scope | Out of Scope |
|----------|--------------|
| Patient dashboard with profile, booking, package, meal-plan, and notification visibility | Initial patient registration |
| Weekly check-in submission with metrics, notes, and photo upload | Consultation booking and payment |
| Patient progress visualization over time | Admin analytics dashboards |
| Doctor view of active program participants | Package purchase flow |
| Doctor review of weekly check-ins and program adjustments | Advanced coaching automations |

## High-Level Acceptance Criteria
- [ ] Patients with active journeys can view dashboard cards for profile or health context, upcoming bookings, package status, meal-plan downloads, and notifications.
- [ ] Patients can submit weekly check-ins that capture quantitative metrics, optional photos, and notes against the active package.
- [ ] Progress views show ordered historical check-in data in a usable trend format.
- [ ] Doctors can view active patients tied to ongoing programs and review submitted check-ins.
- [ ] Doctors can record follow-up review outcomes or program adjustments for a patient's active package.
- [ ] File storage supports the patient artifacts required for meal plans and check-in media.

## Dependencies
- **Prerequisite EPICs:** EPIC-004, EPIC-005, EPIC-008
- **External Dependencies:** Local or S3 storage, PDF generation or hosting for meal plans
- **Technical Prerequisites:** Active-package lifecycle, check-in schema, doctor review endpoints, file storage configuration

## Complexity Assessment
- **Size:** L
- **Technical Complexity:** Medium
- **Integration Complexity:** Medium
- **Estimated Story Count:** 8-11

## Risks & Assumptions
**Assumptions:**
- The missing `user_health_data` and `notifications` models will be defined during story decomposition.
- Meal plans are delivered as file assets rather than generated interactively in-app.

**Risks:**
- Several dashboard data sources are referenced functionally but have no defined schema in the source package.
- Photo uploads and health-tracking data introduce privacy and storage-governance concerns that are not specified.

## Related EPICs
- **Depends On:** EPIC-004, EPIC-005, EPIC-008
- **Blocks:** None
- **Related:** EPIC-007
