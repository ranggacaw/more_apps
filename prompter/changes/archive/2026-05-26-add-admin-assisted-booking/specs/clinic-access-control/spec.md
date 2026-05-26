## ADDED Requirements
### Requirement: Admin-Assisted Booking Authorization
The system SHALL restrict admin-assisted booking creation, slot locking, and immediate confirmation to authenticated verified admin users, and SHALL restrict doctor meeting-link updates to the doctor assigned to the confirmed online booking.

#### Scenario: Non-admin cannot use admin booking assistance
- **WHEN** a patient or doctor requests an admin-assisted booking route
- **THEN** the system denies access and does not create, lock, or confirm any booking

#### Scenario: Verified admin can use booking assistance
- **WHEN** a verified admin requests the admin-assisted booking workflow
- **THEN** the system allows access to the active-doctor, patient-selection, guest-contact, slot-locking, and confirmation tools

#### Scenario: Doctor can update only assigned booking link
- **WHEN** a doctor submits a meeting-link update for a confirmed online booking assigned to that doctor
- **THEN** the system accepts the update only for that assigned booking and rejects updates for other doctors' bookings
