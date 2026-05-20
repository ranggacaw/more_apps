## MODIFIED Requirements
### Requirement: Team-Managed Account Provisioning And Role Updates
The system SHALL let authorized admins create and update `patient`, `doctor`, and `admin` accounts within the role boundaries defined by `clinic-access-control`, SHALL let that workflow persist the requested verification state directly, and SHALL capture required doctor profile data when provisioning or reassigning a doctor account. When a doctor-role account is changed to another supported role, the system SHALL preserve the linked doctor profile record for historical references while marking it inactive for future scheduling and discovery.

#### Scenario: Admin creates a doctor account
- **WHEN** an admin submits a valid new doctor account with the required user credentials, doctor profile details, and chosen verification state
- **THEN** the system creates the linked `users` and `doctors` records
- **AND** persists the requested verification state
- **AND** makes the doctor available for operational use according to existing doctor workflows when the doctor profile is active

#### Scenario: Admin updates an existing user's role
- **WHEN** an admin changes an existing user's role to another supported value in `users.role`
- **THEN** the system persists the new role within the allowed role set
- **AND** persists the requested verification state
- **AND** creates or updates any required doctor profile data before the change takes effect when the target role is `doctor`
- **AND** preserves any existing doctor profile while marking it inactive when the target role is not `doctor`

#### Scenario: Admin submits an invalid role-management request
- **WHEN** an admin attempts to assign an unsupported role or omit required doctor profile data for a doctor-role account
- **THEN** the system rejects the request and leaves the existing account state unchanged
