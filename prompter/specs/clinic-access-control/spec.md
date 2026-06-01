# clinic-access-control Specification

## Purpose
TBD - created by archiving change add-dependable-platform-services. Update Purpose after archive.
## Requirements
### Requirement: Authenticated Verified Operational Access
The system SHALL require users to be authenticated and verified before they can access protected operational routes, including dashboards, booking flows, checkout pages, and administrative tools. For self-registered patient accounts, the verified state SHALL be satisfied only after successful OTP verification.

#### Scenario: Unverified patient is blocked from booking
- **WHEN** an authenticated but unverified patient requests the consultation-booking flow
- **THEN** the system denies access to the operational route
- **AND** the system redirects the patient to complete OTP verification before continuing

#### Scenario: Verified doctor accesses doctor operations
- **WHEN** a verified doctor requests doctor-only operational pages
- **THEN** the system allows access to the doctor dashboard and availability-management routes

### Requirement: Role-Scoped Route Authorization
The system SHALL authorize protected routes according to `users.role` values of `patient`, `doctor`, `admin`, and `super_admin`. Package catalog management routes SHALL remain scoped to the `doctor` role only. Finance statement read routes under `/finance` SHALL be scoped to verified `super_admin` and `doctor` users, while finance mutation routes SHALL be scoped to verified `super_admin` users only. Existing admin operational routes SHALL remain scoped to the `admin` role unless a separate requirement explicitly expands them.

#### Scenario: Doctor cannot access admin dashboard
- **WHEN** a doctor requests an admin-only route
- **THEN** the system denies access to that route

#### Scenario: Admin cannot access doctor package management routes
- **WHEN** an admin requests a doctor-scoped package management route (`/doctor/packages`)
- **THEN** the system denies access to that route

#### Scenario: Patient cannot access doctor completion actions
- **WHEN** a patient attempts to trigger doctor-only consultation or booking completion actions
- **THEN** the system denies the request and leaves the booking state unchanged

#### Scenario: Admin cannot access finance statements
- **WHEN** an admin requests a `/finance` statement route
- **THEN** the system denies access to that route

#### Scenario: Doctor can view finance statements only
- **WHEN** a verified doctor requests a finance statement read route
- **THEN** the system allows the request
- **AND** denies any finance mutation request from that doctor

#### Scenario: Super admin can manage finance records
- **WHEN** a verified `super_admin` requests a finance mutation route for operating expenses or balance-sheet entries
- **THEN** the system allows the request subject to request validation

### Requirement: Controlled Account Provisioning
The system SHALL allow public self-registration only for patient accounts and reserve doctor, admin, and super_admin account creation for seeders or authorized team-managed workflows. Public registration SHALL never expose a path to self-assign doctor, admin, or super_admin roles.

#### Scenario: Public registration creates a patient account
- **WHEN** a new user completes the public registration form
- **THEN** the system creates a patient-role account rather than allowing doctor, admin, or super_admin self-selection

#### Scenario: Privileged roles are not publicly self-assigned
- **WHEN** an unauthenticated user opens the public registration experience
- **THEN** the system does not expose a path to create doctor, admin, or super_admin accounts from that form

#### Scenario: Super admin account is team-managed
- **WHEN** the clinic needs a finance administrator account
- **THEN** the account is created through a seeder or authorized team-managed workflow rather than public self-registration

### Requirement: Admin-Assisted Booking Authorization
The system SHALL restrict admin-assisted booking creation, slot locking, and immediate confirmation to authenticated verified admin users, and SHALL restrict doctor meeting-link updates to the doctor assigned to the confirmed online booking.

#### Scenario: Non-admin cannot use admin booking assistance
- **WHEN** a patient or doctor requests an admin-assisted booking route
- **THEN** the system denies access and does not create, lock, or confirm any booking

#### Scenario: Verified admin can use booking assistance
- **WHEN** a verified admin requests the admin-assisted booking workflow
- **THEN** the system allows access to the active-doctor, patient-selection, guest-contact, slot-locking, and confirmation tools

#### Scenario: Doctor can update only assigned booking link
- **WHEN** a doctor submits a meeting-link update for a confirmed online booking assigned to that doctor
- **THEN** the system accepts the update only for that assigned booking and rejects updates for other doctors' bookings

