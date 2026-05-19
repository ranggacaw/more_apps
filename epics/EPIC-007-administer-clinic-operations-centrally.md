# EPIC-007: Administer Clinic Operations Centrally

## Business Value Statement
This EPIC gives clinic administrators a single back-office capability set for managing commercial, operational, and content workflows. It improves visibility into business performance while reducing manual coordination across packages, users, and communications.

## Description
Deliver the admin dashboard and back-office management tools for KPI overview, package and pricing administration, revenue reporting, conversion analytics, WhatsApp broadcast, content management, and user or role administration. The experience should centralize operational control without requiring direct database access.

## Source Traceability
| Document | Reference | Section/Page |
|----------|-----------|--------------|
| FSD | Admin dashboard features, reports, analytics, broadcast, content, user management | `more_apps_docs.md` 6.3 |
| TDD | Admin routes, `PackageAdminController`, `UserAdminController`, `ReportController`, payments and package data inputs | `more_apps_docs.md` 7.1, 8.1, 9 |
| Wireframe | Not provided; inferred from `Admin/Dashboard.jsx` and `Admin/Reports.jsx` | `more_apps_docs.md` 9 |

## Scope Definition
| In Scope | Out of Scope |
|----------|--------------|
| Admin KPI overview across core business tables | Patient self-service UX |
| Package and pricing CRUD | Doctor consultation note entry |
| Revenue report and conversion-funnel analytics | Low-level infrastructure deployment |
| WhatsApp broadcast tooling | Complex marketing automation beyond broadcast |
| Content management and user or role administration | Accounting-system integration |

## High-Level Acceptance Criteria
- [ ] Administrators can view operational KPIs derived from users, bookings, payments, doctors, and package data.
- [ ] Administrators can create, update, deactivate, and review package offerings and pricing.
- [ ] Administrators can review paid revenue data and conversion metrics across acquisition, booking, and package purchase stages.
- [ ] Administrators can manage users and roles through the application rather than direct data access.
- [ ] Administrators can initiate WhatsApp broadcasts and manage educational or site content referenced by the platform.

## Dependencies
- **Prerequisite EPICs:** EPIC-002, EPIC-003, EPIC-005, EPIC-008
- **External Dependencies:** WhatsApp broadcast provider, reporting data freshness, role-permission design
- **Technical Prerequisites:** Admin route protection, package and user management controllers, analytics queries, content data model

## Complexity Assessment
- **Size:** L
- **Technical Complexity:** Medium
- **Integration Complexity:** Medium
- **Estimated Story Count:** 8-10

## Risks & Assumptions
**Assumptions:**
- Admin reporting can be satisfied initially from transactional tables rather than a separate analytics store.
- Role management will extend the current simple role model defined on `users.role`.

**Risks:**
- `roles` and `educational_content` are referenced functionally but are not represented in the current schema summary.
- Broadcast features can create operational or compliance risk if audience targeting and audit rules are not defined.

## Related EPICs
- **Depends On:** EPIC-002, EPIC-003, EPIC-005, EPIC-008
- **Blocks:** None
- **Related:** EPIC-006
