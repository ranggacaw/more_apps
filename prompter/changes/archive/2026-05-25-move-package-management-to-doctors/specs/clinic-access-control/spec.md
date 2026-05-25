## MODIFIED Requirements
### Requirement: Role-Scoped Route Authorization
The system SHALL authorize protected routes according to `users.role` values of `patient`, `doctor`, and `admin`. Package catalog management routes SHALL be scoped to the `doctor` role only.

#### Scenario: Doctor cannot access admin dashboard
- **WHEN** a doctor requests an admin-only route
- **THEN** the system denies access to that route

#### Scenario: Admin cannot access doctor package management routes
- **WHEN** an admin requests a doctor-scoped package management route (`/doctor/packages`)
- **THEN** the system denies access to that route

#### Scenario: Patient cannot access doctor completion actions
- **WHEN** a patient attempts to trigger doctor-only consultation or booking completion actions
- **THEN** the system denies the request and leaves the booking state unchanged
