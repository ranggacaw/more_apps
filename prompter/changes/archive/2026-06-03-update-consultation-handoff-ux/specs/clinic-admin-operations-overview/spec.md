## MODIFIED Requirements
### Requirement: Recent Admin Activity Visibility
The system SHALL show recent booking and payment activity on the admin dashboard so administrators can monitor operational state transitions without querying the database directly. Recent payment activity SHALL include enough source context for internal consultation-treatment handoffs to identify the patient, source consultation, booking or queue entry, amount, status, and whether the admin can mark an on-site payment as paid.

#### Scenario: Recent operational activity exists
- **WHEN** recent bookings or payments exist
- **THEN** the system shows the latest records with patient, doctor, schedule or source, booking status, and payment status details

#### Scenario: Pending consultation-treatment handoff exists
- **WHEN** a pending internal consultation-treatment payment appears in recent payment activity
- **THEN** the admin dashboard shows the patient/source identity, amount, pending status, and an action to mark the on-site payment as paid when the payment is eligible

#### Scenario: No recent operational activity exists
- **WHEN** no qualifying recent booking or payment activity exists
- **THEN** the dashboard shows an explicit empty state instead of failing or rendering stale placeholders
