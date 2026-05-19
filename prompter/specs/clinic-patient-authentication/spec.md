# clinic-patient-authentication Specification

## Purpose
TBD - created by archiving change add-patient-otp-auth. Update Purpose after archive.
## Requirements
### Requirement: Patient Self-Registration
The system SHALL allow guests to self-register only patient accounts by submitting a unique name, email address, phone number, and password, and it SHALL reject invalid or duplicate registration data with clear validation feedback.

#### Scenario: Valid registration creates an unverified patient account
- **WHEN** a guest submits valid patient registration data
- **THEN** the system creates a new user with the `patient` role in an unverified state
- **AND** the system starts the OTP verification flow for that account instead of granting verified operational access immediately

#### Scenario: Invalid registration data is rejected
- **WHEN** a guest submits missing, malformed, or duplicate registration fields
- **THEN** the system does not create the account
- **AND** the system returns validation errors for the relevant fields

### Requirement: OTP-Based Patient Verification
The system SHALL issue a time-bound one-time password for each newly registered patient verification attempt and SHALL require a matching, unexpired code before marking the patient account as verified.

#### Scenario: Valid OTP verifies the patient account
- **WHEN** an unverified patient submits the correct OTP before it expires
- **THEN** the system marks the patient account as verified
- **AND** the system starts an authenticated session for that patient
- **AND** the system redirects the patient to the patient dashboard

#### Scenario: Invalid or expired OTP leaves the account unverified
- **WHEN** an unverified patient submits an incorrect or expired OTP
- **THEN** the system denies the verification attempt
- **AND** the patient account remains unverified

### Requirement: Session-Based Patient Login and Logout
The system SHALL authenticate patients through Laravel's session-based login and logout flow, and it SHALL route unverified patient sessions back into the OTP verification experience until verification is complete.

#### Scenario: Verified patient signs in successfully
- **WHEN** a verified patient submits valid login credentials
- **THEN** the system starts a session and redirects the patient to the intended route or patient dashboard

#### Scenario: Unverified patient is sent to OTP verification after login
- **WHEN** an unverified patient submits valid login credentials
- **THEN** the system authenticates the patient only for the purpose of completing verification
- **AND** the system redirects the patient to the OTP verification experience instead of verified operational pages

#### Scenario: Authenticated patient logs out cleanly
- **WHEN** an authenticated patient submits a logout request
- **THEN** the system invalidates the current session and redirects the patient away from protected pages

