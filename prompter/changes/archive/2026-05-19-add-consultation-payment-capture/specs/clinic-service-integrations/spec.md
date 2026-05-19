## MODIFIED Requirements

### Requirement: Midtrans Callback Integrity
The system SHALL validate Midtrans webhook signatures before mutating payment, booking, or slot state, SHALL validate the callback amount against the stored consultation payment, and SHALL treat validated consultation callbacks as the authoritative source of final payment, booking, and slot reconciliation with idempotent duplicate handling.

#### Scenario: Invalid webhook signature is rejected
- **WHEN** the application receives a Midtrans callback with an invalid signature
- **THEN** the system rejects the request and leaves payment, booking, and slot records unchanged

#### Scenario: Valid paid callback confirms booking
- **WHEN** the application receives a valid Midtrans callback indicating a successful consultation payment
- **THEN** the system marks the payment as paid, confirms the related booking, transitions the slot from locked to booked, and does not require the frontend callback to finalize the booking

#### Scenario: Valid pending callback preserves pending records
- **WHEN** the application receives a valid Midtrans callback with a pending consultation status
- **THEN** the system records the provider payload while leaving the payment pending, the booking pending, and the slot reserved for that pending checkout

#### Scenario: Valid failed callback releases the reservation
- **WHEN** the application receives a valid Midtrans callback with a denied, cancelled, expired, or otherwise failed consultation status
- **THEN** the system marks the payment as failed, cancels the related booking, and releases the slot back to available inventory

#### Scenario: Duplicate callback does not repeat side effects
- **WHEN** the application receives the same validated terminal callback more than once for the same consultation payment
- **THEN** the system keeps the existing terminal state and does not create duplicate booking confirmations, meeting links, or notification work

### Requirement: Local Payment Simulation Support
The system SHALL provide a non-production consultation-payment simulation path when Midtrans credentials are unavailable in local development and SHALL expose success, pending, and failure simulations that exercise the same server-side state transitions used by live consultation payments.

#### Scenario: Local checkout runs without live Midtrans keys
- **WHEN** a developer opens consultation checkout in a non-production environment without configured Midtrans credentials
- **THEN** the system exposes a safe simulation path that allows the booking-confirmation flow to be exercised without sending live payment requests

#### Scenario: Demo failure releases the consultation slot
- **WHEN** a developer triggers a simulated failed consultation payment in a non-production environment
- **THEN** the system routes the booking, payment, and slot through the same failed-payment reconciliation used for live failed callbacks

## ADDED Requirements

### Requirement: Midtrans Snap Checkout Initialization
The system SHALL initialize consultation checkout for an eligible pending booking by creating or reusing a pending payment attempt with a unique Midtrans order ID, the approved fixed consultation fee of Rp 500.000, and a Snap token or approved local-development demo token.

#### Scenario: Checkout initialization returns a payment session
- **WHEN** the patient opens consultation checkout or requests payment initialization for their eligible pending booking
- **THEN** the system returns the current pending payment attempt details, including the unique order ID, amount, status, and token needed to open Midtrans Snap

### Requirement: Client-Side Snap Flow Handling
The system SHALL let the consultation checkout UI launch Midtrans Snap with the server-issued token and SHALL handle success, pending, error, and close events without directly deciding the final booking outcome on the client.

#### Scenario: Frontend hands payment off to Midtrans
- **WHEN** the patient starts consultation payment from checkout
- **THEN** the client opens Midtrans Snap and only navigates or refreshes the checkout state while waiting for the server-side webhook to authoritatively update booking and payment records
