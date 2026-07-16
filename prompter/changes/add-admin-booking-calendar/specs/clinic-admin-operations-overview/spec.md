## ADDED Requirements
### Requirement: Admin Dashboard Calendar Entry Point
The system SHALL provide a dashboard entry point from the verified admin operations dashboard to the booking calendar so administrators can move from operational overview to scheduled-patient visibility without searching through booking creation or queue pages.

#### Scenario: Admin opens dashboard with calendar shortcut
- **WHEN** a verified admin opens `/admin/dashboard`
- **THEN** the dashboard includes a visible shortcut to `/admin/calendar`
- **AND** the shortcut is distinct from the New Booking and Manage Queue actions
