## ADDED Requirements

### Requirement: Queue-Backed Operational Notifications
The system SHALL execute OTP delivery, booking confirmations, consultation reminders, and package-activation notifications through queued jobs rather than inline request handling.

#### Scenario: Registration queues verification delivery
- **WHEN** a patient completes registration and a verification message must be sent
- **THEN** the system queues the outbound delivery work instead of blocking the registration response on the provider call

#### Scenario: Payment confirmation queues booking notifications
- **WHEN** a consultation payment is confirmed
- **THEN** the system queues the patient-facing confirmation notifications required by the booking workflow

### Requirement: Automated Slot Lock Release
The system SHALL run a scheduler task at least every minute to release consultation slot locks that have been held longer than 15 minutes and to cancel or fail any still-pending booking and payment records attached to those expired locks.

#### Scenario: Expired lock is released automatically
- **WHEN** a slot remains locked beyond its 15-minute hold window without payment confirmation
- **THEN** the scheduler restores the slot to available and updates the related pending records to a non-active state

### Requirement: Consultation Reminder Cadence
The system SHALL schedule day-before and same-day reminders for confirmed consultations on the documented cadence.

#### Scenario: Day-before reminder is dispatched
- **WHEN** a confirmed consultation falls on the next calendar day and has not yet received its day-before reminder
- **THEN** the scheduler queues the reminder and records that the day-before reminder was sent

#### Scenario: Same-day reminder is dispatched near consultation time
- **WHEN** a confirmed consultation enters the configured same-day reminder window and has not yet received its same-day reminder
- **THEN** the scheduler queues the reminder and records that the same-day reminder was sent
