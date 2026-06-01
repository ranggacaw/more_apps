## ADDED Requirements
### Requirement: Configurable Clinic Operating Hours
The system SHALL enforce clinic operating hours from admin-managed settings in addition to doctor availability. By default, appointments SHALL be available Monday through Friday from 16:00 to 20:00 and Saturday through Sunday from 10:00 to 20:00. Patient-facing and standard admin slot search SHALL display only reservable slots that fall within both the selected doctor's active availability and the clinic's active operating hours for the selected day.

#### Scenario: Patient selects a weekday date
- **WHEN** a patient selects a Monday through Friday date during booking
- **THEN** the system returns only reservable slots inside 16:00 to 20:00 and inside the selected doctor's active availability

#### Scenario: Patient selects a weekend date
- **WHEN** a patient selects a Saturday or Sunday date during booking
- **THEN** the system returns only reservable slots inside 10:00 to 20:00 and inside the selected doctor's active availability

#### Scenario: Admin updates clinic operating hours
- **WHEN** an admin updates an active clinic operating-hour setting from the admin settings panel
- **THEN** subsequent slot generation and slot search use the updated setting without requiring code changes

### Requirement: Outside-Hours Booking Rejection
The system SHALL reject patient slot locking, patient booking confirmation, and standard admin booking confirmation when the selected slot is outside configured clinic operating hours. The rejection message SHALL be `Appointments are only available during clinic hours.`

#### Scenario: Patient locks an outside-hours slot
- **WHEN** a patient attempts to lock a slot outside configured clinic operating hours
- **THEN** the system rejects the lock request with `Appointments are only available during clinic hours.`
- **AND** the slot remains available or unchanged

#### Scenario: Patient confirms an outside-hours slot
- **WHEN** a patient attempts to confirm a booking for a slot outside configured clinic operating hours
- **THEN** the system rejects the booking request with `Appointments are only available during clinic hours.`
- **AND** no pending booking or checkout handoff is created for that slot

### Requirement: Admin Schedule Override Audit
The system SHALL let verified admins override clinic operating hours only through an explicit override action that captures an override reason and stores an audit record. Overrides SHALL allow the admin to create or confirm an appointment outside clinic hours without changing the recurring clinic-hour settings for other users.

#### Scenario: Admin confirms an outside-hours appointment with override
- **WHEN** a verified admin selects an outside-hours slot or time, supplies a valid override reason, and confirms the booking
- **THEN** the system creates or confirms the booking, records the schedule override audit entry, and keeps normal clinic-hour settings unchanged

#### Scenario: Admin attempts override without reason
- **WHEN** a verified admin attempts to override clinic hours without an override reason
- **THEN** the system rejects the override and leaves booking and slot records unchanged

#### Scenario: Patient cannot override clinic hours
- **WHEN** a patient attempts to book outside configured clinic hours
- **THEN** the system denies the request rather than exposing an override path
