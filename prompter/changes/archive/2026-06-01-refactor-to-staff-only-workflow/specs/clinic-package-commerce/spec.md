## ADDED Requirements
### Requirement: Admin Package Invoice Finalization
The system SHALL allow verified admin users to finalize pending internal package invoices by marking the payment as paid and activating the related patient package entitlement with consultation credits.

#### Scenario: Admin finalizes a pending package invoice
- **WHEN** a verified admin finalizes a pending internal payment of type `package`
- **THEN** the system marks the payment as paid
- **AND** the system activates a `user_packages` entitlement with the appropriate consultation credits
- **AND** the system links the `user_package_id` back to the consultation

#### Scenario: Non-admin cannot finalize package invoices
- **WHEN** a non-admin user attempts to finalize a package invoice
- **THEN** the system denies access
