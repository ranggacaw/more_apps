## ADDED Requirements

### Requirement: Midtrans Callback Integrity
The system SHALL validate Midtrans webhook signatures before mutating payment, booking, or slot state.

#### Scenario: Invalid webhook signature is rejected
- **WHEN** the application receives a Midtrans callback with an invalid signature
- **THEN** the system rejects the request and leaves payment, booking, and slot records unchanged

#### Scenario: Valid paid callback confirms booking
- **WHEN** the application receives a valid Midtrans callback indicating a successful consultation payment
- **THEN** the system marks the payment as paid, confirms the related booking, and transitions the slot from locked to booked

### Requirement: Provider-Oriented Outbound Services
The system SHALL encapsulate payment, WhatsApp, email, and meeting-link integrations behind application service boundaries so approved providers can be configured or swapped without rewriting booking and payment workflows.

#### Scenario: WhatsApp provider is changed through configuration
- **WHEN** the deployment switches from one approved WhatsApp provider to another
- **THEN** the application continues using the same notification workflow while reading the active provider settings from configuration

#### Scenario: Payment confirmation triggers follow-up services
- **WHEN** a consultation payment is confirmed
- **THEN** the application can generate the meeting-link data and queue notification delivery through the configured service boundaries

### Requirement: Local Payment Simulation Support
The system SHALL provide a non-production consultation-payment simulation path when Midtrans credentials are unavailable in local development.

#### Scenario: Local checkout runs without live Midtrans keys
- **WHEN** a developer opens consultation checkout in a non-production environment without configured Midtrans credentials
- **THEN** the system exposes a safe simulation path that allows the booking-confirmation flow to be exercised without sending live payment requests
