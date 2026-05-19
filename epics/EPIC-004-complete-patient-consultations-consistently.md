# EPIC-004: Complete Patient Consultations Consistently

## Business Value Statement
This EPIC allows doctors to execute paid consultations, record clinical outcomes, and transition patients into the next step of care. It creates the structured consultation output needed for package conversion and continuity of service.

## Description
Deliver the doctor workflow for viewing the current consultation schedule, reviewing available patient screening context, entering consultation notes, selecting a recommended package, and marking a consultation as complete. Completing the consultation must create the consultation record and notify the patient to continue their journey.

## Source Traceability
| Document | Reference | Section/Page |
|----------|-----------|--------------|
| FSD | Doctor completes consultation and recommends a package | `more_apps_docs.md` 2.4 |
| TDD | Doctor dashboard schedule, `ConsultationController@complete`, `consultations` schema, doctor dashboard routes | `more_apps_docs.md` 6.2, 7.1, 8.1, 9 |
| Wireframe | Not provided; inferred from `Doctor/Dashboard.jsx` and `RecommendationForm` | `more_apps_docs.md` 6.2, 9 |

## Scope Definition
| In Scope | Out of Scope |
|----------|--------------|
| Doctor view of today's confirmed consultation schedule | Doctor availability maintenance |
| Access to patient screening or health context needed before consultation | Package payment processing |
| Consultation notes capture and recommended-package selection | Ongoing weekly program management |
| Booking completion workflow | Admin reporting |
| Patient notification after consultation completion | Deep EMR or lab-integration workflows |

## High-Level Acceptance Criteria
- [ ] Doctors can see their current consultation workload in a dashboard view scoped to relevant appointments.
- [ ] Doctors can review the available patient screening or health context before completing the session.
- [ ] Doctors can submit consultation notes and optionally select a recommended package.
- [ ] Completing the consultation creates a consultation record linked to the booking, doctor, patient, and recommended package.
- [ ] The booking is moved into a completed state and the patient receives a notification prompting package selection.

## Dependencies
- **Prerequisite EPICs:** EPIC-002, EPIC-003, EPIC-008
- **External Dependencies:** WhatsApp notification provider for post-consultation follow-up
- **Technical Prerequisites:** Doctor role access, consultation schema, booking status transitions, notification job support

## Complexity Assessment
- **Size:** M
- **Technical Complexity:** Medium
- **Integration Complexity:** Low
- **Estimated Story Count:** 6-8

## Risks & Assumptions
**Assumptions:**
- Screening data exists before the consultation even though its backing schema is not defined in the source package.
- A consultation can recommend at most one package at completion time.

**Risks:**
- Missing specification for `screenings` can delay the doctor workflow or force placeholder implementations.
- Clinical-note quality and recommendation consistency may vary without stronger data-entry standards.

## Related EPICs
- **Depends On:** EPIC-002, EPIC-003, EPIC-008
- **Blocks:** EPIC-005, EPIC-006
- **Related:** EPIC-001
