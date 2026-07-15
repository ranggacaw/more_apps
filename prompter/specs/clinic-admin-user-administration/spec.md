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

### Requirement: Automatic Patient Account Provisioning
The system SHALL let authorized staff create or link a patient account from staff-entered patient identity data when a usable phone number is present, SHALL use the normalized phone number as the patient login identifier, SHALL avoid creating duplicate patient accounts for the same normalized phone number, and SHALL mark newly auto-provisioned patient accounts as requiring first-login password rotation.

#### Scenario: Staff enters a new patient phone number
- **WHEN** authorized staff saves patient identity data with a normalized phone number that is not linked to an existing patient account
- **THEN** the system creates a `patient` user account, assigns a temporary password derived from the phone number according to the configured onboarding rule, marks the account as requiring password rotation, and queues an account-created notification

#### Scenario: Staff enters an existing patient phone number
- **WHEN** authorized staff saves patient identity data with a normalized phone number that already belongs to a patient account
- **THEN** the system links the workflow to the existing patient account and does not create a duplicate user

#### Scenario: Staff opts out of account creation
- **WHEN** authorized staff marks that a patient has no usable phone access or should not receive a portal account
- **THEN** the system stores the patient-facing workflow data without creating a login account and keeps guest/accountless behavior available where already supported

### Requirement: Patient Phone Identity Maintenance
The system SHALL let authorized staff correct a patient account's primary phone number while preserving historical bookings, consultations, payments, packages, and reports, and SHALL keep the phone login identifier unique after normalization.

#### Scenario: Staff corrects a patient phone number
- **WHEN** authorized staff updates a patient account from one valid normalized phone number to another unused normalized phone number
- **THEN** the system updates the patient's login identifier and contact phone while preserving existing clinical and billing relationships

#### Scenario: Staff attempts to reuse another patient's phone number
- **WHEN** authorized staff changes a patient phone number to a normalized value already linked to another patient account
- **THEN** the system rejects the update or requires an explicit account-linking workflow before any patient identity is merged

