## MODIFIED Requirements

### Requirement: Authenticated Verified Operational Access
The system SHALL require users to be authenticated and verified before they can access protected operational routes, including dashboards, booking flows, checkout pages, and administrative tools. For self-registered patient accounts, the verified state SHALL be satisfied only after successful OTP verification.

#### Scenario: Unverified patient is blocked from booking
- **WHEN** an authenticated but unverified patient requests the consultation-booking flow
- **THEN** the system denies access to the operational route
- **AND** the system redirects the patient to complete OTP verification before continuing

#### Scenario: Verified doctor accesses doctor operations
- **WHEN** a verified doctor requests doctor-only operational pages
- **THEN** the system allows access to the doctor dashboard and availability-management routes
