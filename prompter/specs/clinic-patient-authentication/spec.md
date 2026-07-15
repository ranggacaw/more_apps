# clinic-patient-authentication Specification

## Purpose
TBD - created by archiving change add-patient-otp-auth. Update Purpose after archive.
## Requirements
### Requirement: Patient And Staff Authentication
The system SHALL allow verified staff users with roles `doctor`, `admin`, or `super_admin` and verified patient users with role `patient` to authenticate through supported login flows, SHALL redirect each role to its role-appropriate workspace, and SHALL keep public patient self-registration unavailable.

#### Scenario: Staff login still succeeds
- **WHEN** a user with role `doctor`, `admin`, or `super_admin` submits valid credentials and has completed verification
- **THEN** the system starts an authenticated session and redirects to the role-appropriate staff dashboard or finance workspace

#### Scenario: Patient login succeeds
- **WHEN** a verified user with role `patient` submits valid patient credentials
- **THEN** the system starts an authenticated session and redirects to the patient portal dashboard

#### Scenario: Public patient registration remains unavailable
- **WHEN** an unauthenticated visitor looks for patient self-registration
- **THEN** the system does not expose a public patient registration route or create patient accounts without staff-entered patient identity data

### Requirement: Patient First-Login Password Rotation
The system SHALL mark auto-provisioned patient accounts as requiring a password change and SHALL block access to patient portal content until the patient successfully replaces the temporary password.

#### Scenario: Auto-provisioned patient logs in with temporary password
- **WHEN** an auto-provisioned patient authenticates while `must_change_password` is active
- **THEN** the system redirects the patient to the password-change flow instead of the portal dashboard

#### Scenario: Patient changes temporary password
- **WHEN** the patient submits the correct temporary password and a valid new password
- **THEN** the system updates the password, clears the forced-change flag, and allows access to patient portal content

### Requirement: Patient Phone-Based Password Recovery
The system SHALL let registered patient accounts request password recovery through the normalized phone number associated with the patient account, SHALL send recovery instructions through the configured patient messaging provider, and SHALL reject or throttle invalid recovery attempts without disclosing whether unrelated accounts exist.

#### Scenario: Registered patient requests password recovery
- **WHEN** a patient submits the phone number for an active patient account through password recovery
- **THEN** the system queues a recovery message through the configured provider and returns a generic success response

#### Scenario: Unknown phone recovery request is submitted
- **WHEN** a phone number that is not linked to an active patient account is submitted through password recovery
- **THEN** the system returns the same generic response and does not disclose account existence

