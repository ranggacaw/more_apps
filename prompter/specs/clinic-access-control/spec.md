# clinic-access-control Specification

## Purpose
TBD - created by archiving change add-dependable-platform-services. Update Purpose after archive.
## Requirements
### Requirement: Authenticated Verified Operational Access
The system SHALL require users to be authenticated and verified before they can access protected operational routes, including dashboards, booking flows, checkout pages, and administrative tools.

#### Scenario: Unverified patient is blocked from booking
- **WHEN** an authenticated but unverified patient requests the consultation-booking flow
- **THEN** the system denies access and instructs the patient to complete verification before continuing

#### Scenario: Verified doctor accesses doctor operations
- **WHEN** a verified doctor requests doctor-only operational pages
- **THEN** the system allows access to the doctor dashboard and availability-management routes

### Requirement: Role-Scoped Route Authorization
The system SHALL authorize protected routes according to `users.role` values of `patient`, `doctor`, and `admin`.

#### Scenario: Doctor cannot access admin dashboard
- **WHEN** a doctor requests an admin-only route
- **THEN** the system denies access to that route

#### Scenario: Patient cannot access doctor completion actions
- **WHEN** a patient attempts to trigger doctor-only consultation or booking completion actions
- **THEN** the system denies the request and leaves the booking state unchanged

### Requirement: Controlled Account Provisioning
The system SHALL allow public self-registration only for patient accounts and reserve doctor and admin account creation for seeders or authorized team-managed workflows.

#### Scenario: Public registration creates a patient account
- **WHEN** a new user completes the public registration form
- **THEN** the system creates a patient-role account rather than allowing doctor or admin self-selection

#### Scenario: Doctor and admin roles are not publicly self-assigned
- **WHEN** an unauthenticated user opens the public registration experience
- **THEN** the system does not expose a path to create doctor or admin accounts from that form

