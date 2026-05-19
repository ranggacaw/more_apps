# clinic-package-commerce Specification

## Purpose
TBD - created by archiving change add-wellness-package-credit-checkout. Update Purpose after archive.
## Requirements
### Requirement: Credit-Aware Package Catalog
The system SHALL let a verified patient browse the active wellness package catalog with package pricing that reflects the patient's current consultation credit state, including the original package price, the credit amount applied, the final payable amount, and whether package checkout is currently eligible.

#### Scenario: Eligible patient opens the package catalog
- **WHEN** a verified patient has a positive, unexpired consultation credit linked to a completed consultation
- **THEN** the system returns each active package with its original price, applied credit amount, final payable amount, and an eligible checkout state

#### Scenario: Patient opens the package catalog with unavailable credit
- **WHEN** a verified patient has no consultation credit or only an expired or already-consumed credit
- **THEN** the system still returns the active package catalog with zero applied credit and marks package checkout as unavailable until eligibility is restored

### Requirement: Credit-Protected Package Checkout
The system SHALL only let a verified patient start package checkout when the selected package is active, the patient has a positive unexpired consultation credit, the credit's source consultation is completed, and that credit has not already funded another package purchase.

#### Scenario: Ineligible package checkout is rejected
- **WHEN** a patient attempts to start package checkout with missing, expired, consumed, or not-yet-qualified consultation credit
- **THEN** the system rejects the checkout attempt and does not create a package payment or activate an entitlement

#### Scenario: Funded package checkout starts with a discounted balance
- **WHEN** an eligible patient selects an active package whose price exceeds the available consultation credit
- **THEN** the system creates or reuses a pending package payment attempt for the final payable amount after the valid credit deduction

### Requirement: Zero-Balance Package Activation
The system SHALL immediately activate the selected package without Midtrans when the patient's valid consultation credit fully covers the package price, and SHALL record the purchase outcome so credit consumption and package activation remain auditable.

#### Scenario: Consultation credit covers the full package price
- **WHEN** an eligible patient selects an active package whose price is less than or equal to the available consultation credit
- **THEN** the system consumes the consultation credit, records the package purchase as completed, activates the patient entitlement, and returns a completed checkout result without issuing a Midtrans session

