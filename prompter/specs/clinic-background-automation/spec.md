# clinic-background-automation Specification

## Purpose
TBD - created by archiving change add-dependable-platform-services. Update Purpose after archive.
## Requirements
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

### Requirement: Active Program Engagement Notifications
The system SHALL queue weekly patient check-in reminders for active packages and SHALL queue patient follow-up notifications after a doctor reviews a weekly check-in, using the same queued outbound notification pattern as the rest of the clinic notification flows.

#### Scenario: Active package reaches a due weekly check-in window
- **WHEN** an active package enters a new seven-day program week and the patient has not yet submitted that week's check-in
- **THEN** the scheduler queues a weekly reminder notification for that package without sending it inline from a web request

#### Scenario: Doctor review triggers patient follow-up
- **WHEN** the responsible doctor records review notes for a patient's weekly check-in
- **THEN** the system queues a patient-facing follow-up notification that the latest weekly review is available

