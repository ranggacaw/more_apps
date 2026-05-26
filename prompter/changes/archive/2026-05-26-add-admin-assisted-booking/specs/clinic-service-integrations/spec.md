## ADDED Requirements
### Requirement: Admin Booking And Meeting Link Notifications
The system SHALL queue notification work for admin-assisted booking confirmations, doctor meeting-link requests, and patient or guest meeting-link availability through the configured email and WhatsApp service boundaries. Guest notifications SHALL use WhatsApp contact stored on the booking, while registered patient notifications MAY use both email and WhatsApp when those contacts exist.

#### Scenario: Online admin booking notifies the doctor to add a link
- **WHEN** a verified admin confirms an online admin-assisted booking without a meeting link
- **THEN** the system queues a notification to the assigned doctor indicating that a Google Meet link must be added

#### Scenario: Doctor-submitted link notifies patient or guest
- **WHEN** the assigned doctor saves the required Google Meet link for an online admin-assisted booking
- **THEN** the system queues notification delivery to the registered patient or guest WhatsApp contact with the consultation schedule and join link

#### Scenario: Offline admin booking confirms without link request
- **WHEN** a verified admin confirms an offline admin-assisted booking
- **THEN** the system queues the appropriate schedule confirmation to the registered patient or guest contact without requesting a meeting link from the doctor
