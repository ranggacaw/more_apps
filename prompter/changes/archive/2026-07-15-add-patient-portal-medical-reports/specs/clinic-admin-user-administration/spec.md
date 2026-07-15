## ADDED Requirements
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
