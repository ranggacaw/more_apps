# clinic-admin-operations-overview Specification

## Purpose
TBD - created by archiving change add-central-admin-operations. Update Purpose after archive.
## Requirements
### Requirement: Admin Operations Dashboard
The system SHALL provide verified admins, under the access rules defined by `clinic-access-control`, with a central dashboard that summarizes current operational KPIs across users, bookings, payments, packages, and active patient package entitlements. The system SHALL also provide a link to the dedicated walk-in queue management page at `/admin/queue` and SHALL show a summary count of current walk-in queue entries (waiting, assigned, in consultation) on the main dashboard.

#### Scenario: Admin opens the operations dashboard
- **WHEN** a verified admin requests `/admin/dashboard`
- **THEN** the system shows KPI totals for patient, doctor, and admin accounts
- **AND** shows paid revenue plus current booking and package activity derived from transactional records rather than manual data entry
- **AND** shows a walk-in queue summary with counts of waiting and active patients and a link to `/admin/queue`

### Requirement: Recent Admin Activity Visibility
The system SHALL show recent booking and payment activity on the admin dashboard so administrators can monitor operational state transitions without querying the database directly. Recent payment activity SHALL include enough source context for internal consultation-treatment handoffs to identify the patient, source consultation, booking or queue entry, amount, status, and whether the admin can mark an on-site payment as paid.

#### Scenario: Recent operational activity exists
- **WHEN** recent bookings or payments exist
- **THEN** the system shows the latest records with patient, doctor, schedule or source, booking status, and payment status details

#### Scenario: Pending consultation-treatment handoff exists
- **WHEN** a pending internal consultation-treatment payment appears in recent payment activity
- **THEN** the admin dashboard shows the patient/source identity, amount, pending status, and an action to mark the on-site payment as paid when the payment is eligible

#### Scenario: No recent operational activity exists
- **WHEN** no qualifying recent booking or payment activity exists
- **THEN** the dashboard shows an explicit empty state instead of failing or rendering stale placeholders

