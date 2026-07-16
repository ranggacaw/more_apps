## ADDED Requirements
### Requirement: Admin Booking Calendar Visibility
The system SHALL provide verified admins with a dedicated booking calendar at `/admin/calendar` that displays scheduled consultation bookings across month, week, and day views using booking slot times as the source of calendar placement. The calendar SHALL allow admins to select a date and view the listed patients for that date, including registered and guest patient identity, contact phone or WhatsApp when present, doctor, scheduled time, consultation mode, booking status, guest or registered marker, queue state when already checked in, and a Review link to the booking detail. The calendar SHALL be visibility-first and SHALL NOT create queue numbers, mark no-shows, reschedule bookings, or change booking status in its first version.

#### Scenario: Admin opens the booking calendar
- **WHEN** a verified admin opens `/admin/calendar`
- **THEN** the system shows a calendar view defaulting to the current date and month view
- **AND** each visible calendar date shows the number of bookings scheduled for that date

#### Scenario: Admin selects a busy date
- **WHEN** a verified admin selects a calendar date that has scheduled bookings
- **THEN** the system shows the listed patients for that date ordered by scheduled appointment time
- **AND** each booking row includes patient identity, contact, doctor, mode, status, queue state when present, and a Review link

#### Scenario: Calendar remains read-only for arrival operations
- **WHEN** a verified admin views a booking on the calendar
- **THEN** the system does not expose inline check-in, no-show, queue-number assignment, or rescheduling controls from the calendar page

#### Scenario: Admin changes calendar view
- **WHEN** a verified admin switches between month, week, and day views
- **THEN** the system reloads the calendar for the requested visible date range while preserving supported filters in the query string
