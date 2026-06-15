## MODIFIED Requirements
### Requirement: Role-Scoped Route Authorization
The system SHALL authorize protected routes according to `users.role` values of `doctor`, `admin`, `super_admin`, and `patient`. Operational staff routes SHALL remain limited to their existing staff role scopes, package catalog management routes SHALL remain scoped to the `doctor` role only, finance routes SHALL remain scoped according to finance requirements, and patient portal routes SHALL be scoped to verified `patient` users only.

#### Scenario: Doctor cannot access admin dashboard
- **WHEN** a doctor requests an admin-only route
- **THEN** the system denies access to that route

#### Scenario: Admin cannot access doctor package management routes
- **WHEN** an admin requests a doctor-scoped package management route (`/doctor/packages`)
- **THEN** the system denies access to that route

#### Scenario: Patient cannot access operational staff routes
- **WHEN** a patient requests a doctor, admin, finance, queue, or staff-only operational route
- **THEN** the system denies access to that route without exposing staff-only data

#### Scenario: Staff cannot access patient-only portal routes
- **WHEN** a doctor, admin, or super admin requests a patient-only portal route
- **THEN** the system denies access according to the patient route authorization rules

#### Scenario: Patient can access patient portal routes
- **WHEN** a verified patient requests a patient portal route for dashboard, progress, or reports
- **THEN** the system allows access subject to patient record ownership checks
