## MODIFIED Requirements
### Requirement: Authenticated Verified Operational Access
The system SHALL require users to be authenticated and verified before they can access protected operational routes, including dashboards, booking flows, checkout pages, and administrative tools. 

#### Scenario: Verified doctor accesses doctor operations
- **WHEN** a verified doctor requests doctor-only operational pages
- **THEN** the system allows access to the doctor dashboard and availability-management routes

### Requirement: Role-Scoped Route Authorization
The system SHALL authorize protected routes according to `users.role` values of `doctor`, `admin`, and `super_admin`. Package catalog management routes SHALL be scoped to the `doctor` role only.

#### Scenario: Doctor cannot access admin dashboard
- **WHEN** a doctor requests an admin-only route
- **THEN** the system denies access to that route

#### Scenario: Admin cannot access doctor package management routes
- **WHEN** an admin requests a doctor-scoped package management route (`/doctor/packages`)
- **THEN** the system denies access to that route


