# clinic-admin-user-administration Specification

## Purpose
TBD - created by archiving change add-central-admin-operations. Update Purpose after archive.
## Requirements
### Requirement: Admin User Directory
The system SHALL provide admins with a searchable, filterable user directory showing each user's role, verification state, and key operational context needed for back-office follow-up.

#### Scenario: Admin filters the user directory
- **WHEN** an admin filters users by role or verification state
- **THEN** the system returns only matching users with their relevant operational summary data

### Requirement: Team-Managed Account Provisioning And Role Updates
The system SHALL let authorized admins create and update `patient`, `doctor`, and `admin` accounts within the role boundaries defined by `clinic-access-control`, and SHALL capture required doctor profile data when provisioning or reassigning a doctor account.

#### Scenario: Admin creates a doctor account
- **WHEN** an admin submits a valid new doctor account with the required user credentials and doctor profile details
- **THEN** the system creates the linked `users` and `doctors` records and makes the doctor available for operational use according to existing doctor workflows

#### Scenario: Admin updates an existing user's role
- **WHEN** an admin changes an existing user's role to another supported value in `users.role`
- **THEN** the system persists the new role within the allowed role set
- **AND** creates or updates any required doctor profile data before the change takes effect when the target role is `doctor`

#### Scenario: Admin submits an invalid role-management request
- **WHEN** an admin attempts to assign an unsupported role or omit required doctor profile data for a doctor-role account
- **THEN** the system rejects the request and leaves the existing account state unchanged

