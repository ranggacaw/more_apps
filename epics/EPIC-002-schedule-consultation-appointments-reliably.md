# EPIC-002: Schedule Consultation Appointments Reliably

## Business Value Statement
This EPIC turns patient intent into scheduled consultation demand by exposing doctor availability and reservable time slots. It reduces manual scheduling work while creating the operational foundation for paid consultations.

## Description
Deliver the consultation booking experience, including doctor discovery, recurring availability management, slot generation, slot search, temporary slot locking, and pending booking creation. The workflow must prevent double-booking and hand the patient off to checkout once a slot is reserved.

## Source Traceability
| Document | Reference | Section/Page |
|----------|-----------|--------------|
| FSD | Doctor selection, slot selection, slot locking, booking creation | `more_apps_docs.md` 2.2, 4.1 |
| TDD | `doctors`, `doctor_availabilities`, `time_slots`, `bookings`; slot API routes; scheduler release logic; booking pages and controllers | `more_apps_docs.md` 4.2, 7.1, 8.1, 9 |
| Wireframe | Not provided; inferred from `Patient/BookConsultation.jsx`, `BookingCalendar.jsx`, `Doctor/Availability.jsx` | `more_apps_docs.md` 9 |

## Scope Definition
| In Scope | Out of Scope |
|----------|--------------|
| Doctor list with active profiles, photos, and bios | Payment capture and reconciliation |
| Doctor recurring availability management | Meeting link creation |
| Slot generation per doctor and date | Post-consultation package sales |
| Available-slot query filtered by doctor and date | Admin reporting on bookings |
| 15-minute slot locking with user ownership | Reminder notification delivery |
| Pending booking creation and checkout handoff | Complex rescheduling or waitlist logic |

## High-Level Acceptance Criteria
- [ ] Doctors can define recurring availability windows with slot duration settings.
- [ ] The system can generate concrete appointment slots from doctor availability for a target date.
- [ ] Patients can browse only active doctors and retrieve only available slots for a selected doctor and date.
- [ ] Selecting a slot places an exclusive 15-minute lock tied to the patient and prevents concurrent booking by others.
- [ ] Expired locks are released automatically so inventory returns to the available pool.
- [ ] Confirming a selected slot creates a pending booking and redirects the patient to consultation checkout.

## Dependencies
- **Prerequisite EPICs:** EPIC-001, EPIC-008
- **External Dependencies:** Scheduler or cron execution for lock-release automation
- **Technical Prerequisites:** Doctor and slot data model, booking controller, slot-generation command, scheduler support

## Complexity Assessment
- **Size:** L
- **Technical Complexity:** Medium
- **Integration Complexity:** Medium
- **Estimated Story Count:** 8-10

## Risks & Assumptions
**Assumptions:**
- Slot generation may be launched manually first through Artisan before full automation is added.
- A single doctor owns a slot from creation through booking confirmation.

**Risks:**
- Race conditions around simultaneous slot locking can create booking defects if locking is not atomic.
- Time zone, daylight-saving, and clinic-hours edge cases are not specified in the source document.

## Related EPICs
- **Depends On:** EPIC-001, EPIC-008
- **Blocks:** EPIC-003, EPIC-004, EPIC-007
- **Related:** EPIC-006
