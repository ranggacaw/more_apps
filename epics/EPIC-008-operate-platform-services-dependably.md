# EPIC-008: Operate Platform Services Dependably

## Business Value Statement
This EPIC provides the technical foundation required to launch and run the clinic platform reliably. It reduces operational risk by establishing the data model, integration patterns, automation, and security controls that every business-facing EPIC depends on.

## Description
Deliver the shared platform capabilities across data persistence, route protection, external-service integration, background jobs, scheduling, storage, and deployment configuration. This EPIC covers the infrastructure and non-functional controls needed for the booking, payment, care-delivery, and admin experiences to work as a dependable product.

## Source Traceability
| Document | Reference | Section/Page |
|----------|-----------|--------------|
| FSD | Cross-cutting operational expectations implied by registration, booking, payment, reminders, and uploads | `more_apps_docs.md` 2, 4, 5, 6 |
| TDD | Tech stack, service integrations, queue, scheduler, schema, routes, folder structure, environment variables | `more_apps_docs.md` 1, 3, 4.2, 7, 8, 9, Environment Variables |
| Wireframe | Not applicable for platform foundation; no standalone infrastructure wireframe expected | N/A |

## Scope Definition
| In Scope | Out of Scope |
|----------|--------------|
| Core schema for users, doctors, packages, slots, bookings, payments, user packages, check-ins, and consultations | Detailed visual design |
| Role and verified route protection | Marketing-site SEO work |
| Queue-backed jobs for OTP, reminders, confirmations, and package activation | Full observability platform build-out |
| Scheduler tasks for slot release and reminders | Native mobile infrastructure |
| Storage strategy for patient uploads and meal-plan PDFs | Vendor contract negotiation |
| Midtrans, WhatsApp, email, and meeting-service integration setup | Advanced disaster-recovery architecture |
| Hosting and environment configuration for a single Laravel app | Multi-region deployment |

## High-Level Acceptance Criteria
- [ ] The platform data model supports the documented core entities and relationships for users, doctors, availability, slots, bookings, payments, packages, check-ins, and consultations.
- [ ] Route and middleware design enforce authenticated, verified, and role-based access where the source flow requires it.
- [ ] Webhook processing and external-service calls are protected by signature validation, throttling, and background-job execution where appropriate.
- [ ] Scheduler automation releases expired slot locks and sends consultation reminders on the documented cadence.
- [ ] Storage configuration supports required patient media, document uploads, and meal-plan file delivery using local or S3-backed storage.
- [ ] The Laravel application is configurable for Midtrans, WhatsApp, email, queue, database, and meeting integrations through environment settings.

## Dependencies
- **Prerequisite EPICs:** None
- **External Dependencies:** Midtrans, Fonnte or Wablas, Zoom or Google Meet, Mailtrap or Mailgun, local or S3 storage, VPS or Forge or Nginx runtime
- **Technical Prerequisites:** Laravel application baseline, PostgreSQL availability, queue worker strategy, scheduler or cron execution

## Complexity Assessment
- **Size:** XL
- **Technical Complexity:** High
- **Integration Complexity:** High
- **Estimated Story Count:** 12-15

## Risks & Assumptions
**Assumptions:**
- The solution remains a single Laravel plus Inertia application rather than splitting into separate API and frontend deployments.
- Database-backed queues are acceptable for initial launch unless load requires Redis.

**Risks:**
- Several functional data sources referenced in the dashboards are not yet modeled, which can force schema changes late in delivery.
- Reliability depends on correctly operating queue workers, cron, and third-party credentials across every environment.

## Related EPICs
- **Depends On:** None
- **Blocks:** EPIC-001, EPIC-002, EPIC-003, EPIC-004, EPIC-005, EPIC-006, EPIC-007
- **Related:** None
