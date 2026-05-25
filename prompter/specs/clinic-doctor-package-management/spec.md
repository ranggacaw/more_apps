# clinic-doctor-package-management Specification

## Purpose
TBD - created by archiving change move-package-management-to-doctors. Update Purpose after archive.
## Requirements
### Requirement: Doctor Package Catalog Management
The system SHALL let verified doctors create, update, review, and deactivate package offerings and pricing used by `clinic-package-commerce`, while preserving historical links from payments, consultations, and patient package entitlements.

#### Scenario: Doctor creates a package offering
- **WHEN** a verified doctor submits a valid package name, description, price, duration, type, and active state through the doctor package management route
- **THEN** the system stores the package and makes it available to the patient package catalog when marked active

#### Scenario: Doctor updates an existing package
- **WHEN** a verified doctor modifies the name, description, price, duration, type, or active state of an existing package
- **THEN** the system persists the changes and updates the patient catalog accordingly

#### Scenario: Doctor deactivates an in-use package
- **WHEN** a verified doctor deactivates a package that is already referenced by historical payments, consultations, or patient entitlements
- **THEN** the system keeps those historical records intact
- **AND** prevents the package from appearing as a newly purchasable active offering

#### Scenario: Non-doctor cannot access doctor package management
- **WHEN** an admin or patient attempts to access a doctor package management route
- **THEN** the system denies access to that route

