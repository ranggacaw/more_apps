## MODIFIED Requirements

### Requirement: Queue-Backed Operational Notifications
The system SHALL execute OTP delivery, booking confirmations, consultation reminders, and package-activation notifications through queued jobs rather than inline request handling, using the configured outbound provider flow for each notification type.

#### Scenario: Registration queues OTP delivery
- **WHEN** a patient completes registration and a verification code must be sent
- **THEN** the system queues the OTP delivery work instead of blocking the registration response on the provider call

#### Scenario: Payment confirmation queues booking notifications
- **WHEN** a consultation payment is confirmed
- **THEN** the system queues the patient-facing confirmation notifications required by the booking workflow
