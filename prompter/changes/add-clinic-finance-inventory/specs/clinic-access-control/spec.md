## MODIFIED Requirements
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
