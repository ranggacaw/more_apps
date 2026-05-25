# clinic-admin-commerce-reporting Specification

## Purpose
TBD - created by archiving change add-central-admin-operations. Update Purpose after archive.
## Requirements
### Requirement: Admin Revenue Reporting
The system SHALL provide admins with revenue reporting derived from paid `payments` records, including separate consultation and package totals for a selected reporting window.

#### Scenario: Admin reviews paid revenue totals
- **WHEN** an admin opens the revenue report for a valid date range
- **THEN** the system shows paid totals and counts split by payment type using transactional payment records

### Requirement: Admin Conversion Funnel Analytics
The system SHALL provide admins with a conversion overview derived from `users`, `bookings`, paid consultation payments, and `user_packages` so they can review acquisition-to-purchase drop-off without a separate analytics store.

#### Scenario: Admin reviews the conversion funnel
- **WHEN** an admin opens the conversion analytics view
- **THEN** the system shows funnel counts for registered users, verified patients, consultation bookings, paid consultations, and package purchases based on current transactional data

