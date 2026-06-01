# clinic-access-control Specification

## Purpose
TBD - created by archiving change add-dependable-platform-services. Update Purpose after archive.
## Requirements
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

