## ADDED Requirements
### Requirement: Admin Booking Calendar Navigation
The system SHALL make the admin booking calendar reachable from the verified admin workspace navigation with a clear active-page state, while keeping booking creation, arrival queue management, and booking calendar visibility as distinct admin destinations.

#### Scenario: Admin opens the operational workspace navigation
- **WHEN** a verified admin opens an admin operational page on desktop or mobile
- **THEN** the navigation includes a Calendar destination for `/admin/calendar`
- **AND** the navigation keeps separate destinations for booking creation and queue management

#### Scenario: Admin is on the calendar page
- **WHEN** a verified admin views `/admin/calendar`
- **THEN** the Calendar navigation item is shown as the current active admin destination
