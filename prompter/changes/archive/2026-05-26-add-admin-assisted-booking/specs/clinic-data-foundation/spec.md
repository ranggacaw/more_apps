## ADDED Requirements
### Requirement: Admin-Assisted Booking Records
The system SHALL persist admin-assisted booking data without requiring every booking to have a registered patient user, including booking source, booked-by admin identity, consultation mode, optional registered patient link, guest patient name, required guest WhatsApp number for guest bookings, and meeting-link request timestamps for online bookings. Guest consultation records SHALL preserve patient identity and contact from the booking without creating a login account.

#### Scenario: Admin-assisted registered patient booking is stored
- **WHEN** a verified admin confirms a booking for an existing patient account
- **THEN** the booking stores the patient user link, booked-by admin identity, admin-assisted source, selected consultation mode, and slot relationship needed for doctor delivery

#### Scenario: Admin-assisted guest booking is stored
- **WHEN** a verified admin confirms a booking for a non-registered patient
- **THEN** the booking stores guest patient name and WhatsApp contact without creating a `users` record
- **AND** the booking remains linked to the selected doctor and slot for operational delivery

#### Scenario: Online admin-assisted booking tracks meeting-link request state
- **WHEN** an admin confirms an online admin-assisted booking without a meeting link
- **THEN** the booking stores that a doctor-hosted meeting link has been requested and can later record when the doctor submits the link
