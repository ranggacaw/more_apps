## ADDED Requirements
### Requirement: Admin Package Catalog Management
The system SHALL let admins create, update, review, and deactivate package offerings and pricing used by `clinic-package-commerce`, while preserving historical links from payments, consultations, and patient package entitlements.

#### Scenario: Admin creates a package offering
- **WHEN** an admin submits a valid package name, description, price, duration, type, and active state
- **THEN** the system stores the package and makes it available to the patient package catalog when marked active

#### Scenario: Admin deactivates an in-use package
- **WHEN** an admin deactivates a package that is already referenced by historical payments, consultations, or patient entitlements
- **THEN** the system keeps those historical records intact
- **AND** prevents the package from appearing as a newly purchasable active offering

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
