# clinic-service-integrations Specification

## Purpose
TBD - created by archiving change add-dependable-platform-services. Update Purpose after archive.
## Requirements
### Requirement: Midtrans Callback Integrity
The system SHALL validate Midtrans webhook signatures before mutating payment, booking, slot, user credit, or package entitlement state, SHALL validate the callback amount against the stored payment amount, and SHALL treat validated consultation and funded package callbacks as the authoritative source of final payment and reconciliation with idempotent duplicate handling.

#### Scenario: Invalid webhook signature is rejected
- **WHEN** the application receives a Midtrans callback with an invalid signature
- **THEN** the system rejects the request and leaves payment, booking, slot, credit, and entitlement records unchanged

#### Scenario: Valid paid callback confirms a consultation booking
- **WHEN** the application receives a valid Midtrans callback indicating a successful consultation payment
- **THEN** the system marks the payment as paid, confirms the related booking, transitions the slot from locked to booked, awards the patient's consultation credit, and does not require the frontend callback to finalize the booking

#### Scenario: Valid paid callback activates a funded package purchase
- **WHEN** the application receives a valid Midtrans callback indicating a successful package payment with a remaining balance greater than zero
- **THEN** the system marks the payment as paid, consumes the patient's consultation credit once, activates the selected package entitlement, and does not require the frontend callback to finalize the package purchase

#### Scenario: Valid pending callback preserves pending records
- **WHEN** the application receives a valid Midtrans callback with a pending payment status
- **THEN** the system records the provider payload while leaving the payment and any related non-terminal purchase state pending

#### Scenario: Valid failed callback releases a consultation reservation
- **WHEN** the application receives a valid Midtrans callback with a denied, cancelled, expired, or otherwise failed consultation status
- **THEN** the system marks the consultation payment as failed, cancels the related booking, and releases the slot back to available inventory

#### Scenario: Valid failed callback preserves package credit
- **WHEN** the application receives a valid Midtrans callback with a denied, cancelled, expired, or otherwise failed funded package-payment status
- **THEN** the system marks the package payment as failed without consuming the patient's consultation credit or activating a package entitlement

#### Scenario: Duplicate callback does not repeat side effects
- **WHEN** the application receives the same validated terminal callback more than once for the same consultation or funded package payment
- **THEN** the system keeps the existing terminal state and does not create duplicate booking confirmations, credit awards, package activations, or notification work

### Requirement: Provider-Oriented Outbound Services
The system SHALL encapsulate payment, WhatsApp, email, and meeting-link integrations behind application service boundaries so approved providers can be configured or swapped without rewriting booking and payment workflows.

#### Scenario: WhatsApp provider is changed through configuration
- **WHEN** the deployment switches from one approved WhatsApp provider to another
- **THEN** the application continues using the same notification workflow while reading the active provider settings from configuration

#### Scenario: Payment confirmation triggers follow-up services
- **WHEN** a consultation payment is confirmed
- **THEN** the application can generate the meeting-link data and queue notification delivery through the configured service boundaries

### Requirement: Local Payment Simulation Support
The system SHALL provide non-production payment simulation paths when Midtrans credentials are unavailable in local development, and SHALL expose success, pending, and failure simulations that exercise the same server-side state transitions used by live consultation and funded package payments.

#### Scenario: Local consultation checkout runs without live Midtrans keys
- **WHEN** a developer opens consultation checkout in a non-production environment without configured Midtrans credentials
- **THEN** the system exposes a safe simulation path that allows the booking-confirmation flow to be exercised without sending live payment requests

#### Scenario: Local funded package checkout runs without live Midtrans keys
- **WHEN** a developer opens package checkout with a positive remaining balance in a non-production environment without configured Midtrans credentials
- **THEN** the system exposes a safe simulation path that allows the package-payment and activation flow to be exercised without sending live payment requests

#### Scenario: Demo failure preserves package credit
- **WHEN** a developer triggers a simulated failed funded package payment in a non-production environment
- **THEN** the system routes the package purchase through the same failed-payment reconciliation used for live failed callbacks and leaves the consultation credit available for another attempt

### Requirement: Midtrans Snap Checkout Initialization
The system SHALL initialize consultation checkout using the fixed clinic consultation charge configured by `clinic.consultation_fee`, regardless of any doctor profile pricing fields, and SHALL initialize any package checkout with a positive remaining balance by creating or reusing a pending payment attempt with a unique Midtrans order ID, the approved payable amount after any valid credit deduction, and a Snap token or approved local-development demo token. The system SHALL return an immediate completed result instead of a Snap session when a package checkout's final payable amount is zero.

#### Scenario: Consultation checkout initialization returns a payment session
- **WHEN** the patient opens consultation checkout or requests payment initialization for their eligible pending booking
- **THEN** the system returns the current pending consultation payment attempt details, including the unique order ID, an amount equal to the configured `clinic.consultation_fee`, status, and token needed to open Midtrans Snap

#### Scenario: Funded package checkout initialization returns a discounted payment session
- **WHEN** an eligible patient requests package checkout for an active package whose final payable amount is greater than zero
- **THEN** the system returns a pending package payment attempt with the selected package, applied credit amount, discounted final amount, and token needed to open Midtrans Snap

#### Scenario: Zero-balance package checkout returns an immediate completion result
- **WHEN** an eligible patient requests package checkout for an active package whose final payable amount is zero
- **THEN** the system completes the package purchase immediately and returns the completed purchase state without creating a Snap token

### Requirement: Client-Side Snap Flow Handling
The system SHALL let the consultation and funded package checkout UIs launch Midtrans Snap with the server-issued token and SHALL handle success, pending, error, and close events without directly deciding the final booking or package outcome on the client.

#### Scenario: Consultation checkout hands payment off to Midtrans
- **WHEN** the patient starts consultation payment from checkout
- **THEN** the client opens Midtrans Snap and only navigates or refreshes the checkout state while waiting for the server-side webhook to authoritatively update booking and payment records

#### Scenario: Funded package checkout hands payment off to Midtrans
- **WHEN** the patient starts package payment from checkout for a discounted balance greater than zero
- **THEN** the client opens Midtrans Snap and only navigates or refreshes the checkout state while waiting for the server-side webhook to authoritatively update payment, credit, and package-entitlement records

