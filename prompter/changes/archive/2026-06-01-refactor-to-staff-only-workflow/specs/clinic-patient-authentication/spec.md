## ADDED Requirements
### Requirement: Staff-Only Authentication
The system SHALL restrict application access to authenticated staff accounts with roles `doctor`, `admin`, or `super_admin`, and SHALL reject login attempts from any non-staff role.

#### Scenario: Staff login succeeds
- **WHEN** a user with role `doctor`, `admin`, or `super_admin` submits valid credentials
- **THEN** the system starts an authenticated session and redirects to the role-appropriate dashboard

#### Scenario: Non-staff login is rejected
- **WHEN** a user with role `patient` or `null` submits valid credentials
- **THEN** the system rejects the login attempt with an appropriate error message

## REMOVED Requirements
### Requirement: Patient Self-Registration
**Reason**: Transitioning to a staff-only workflow where patients no longer access the system directly.
**Migration**: Delete public registration routes and views.

### Requirement: OTP-Based Patient Verification
**Reason**: Transitioning to a staff-only workflow.
**Migration**: Delete OTP verification logic and routes.

### Requirement: Session-Based Patient Login and Logout
**Reason**: Transitioning to a staff-only workflow.
**Migration**: Remove patient-specific session logic.
