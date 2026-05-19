## MODIFIED Requirements
### Requirement: Queue-Backed Operational Notifications
The system SHALL execute OTP delivery, booking confirmations, consultation reminders, consultation-completion follow-up prompts, and package-activation notifications through queued jobs rather than inline request handling, using the configured outbound provider flow for each notification type, SHALL queue consultation confirmation messages only after payment success has produced the meeting access details required by the booking workflow, and SHALL queue package-activation notifications after either a funded package settlement or an immediate zero-balance activation.

#### Scenario: Registration queues OTP delivery
- **WHEN** a patient completes registration and a verification code must be sent
- **THEN** the system queues the OTP delivery work instead of blocking the registration response on the provider call

#### Scenario: Payment confirmation queues booking notifications
- **WHEN** a consultation payment is confirmed
- **THEN** the system queues the patient-facing confirmation notifications required by the booking workflow

#### Scenario: Confirmed consultation notifications include access details
- **WHEN** a consultation payment is confirmed and the booking has generated meeting access details
- **THEN** the system queues the patient-facing WhatsApp and email confirmations with the consultation access details needed to join the appointment

#### Scenario: Completed consultation queues package-selection follow-up
- **WHEN** a doctor successfully completes a consultation with or without a recommended package
- **THEN** the system queues the patient-facing follow-up notification that prompts the patient to continue to package selection

#### Scenario: Package activation notification is queued
- **WHEN** a patient entitlement is activated after a funded or zero-balance package purchase
- **THEN** the system queues the patient-facing package activation notification instead of delivering it inline with the purchase flow
