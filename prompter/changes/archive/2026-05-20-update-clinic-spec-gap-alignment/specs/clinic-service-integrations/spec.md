## MODIFIED Requirements
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
