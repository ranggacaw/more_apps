## MODIFIED Requirements
### Requirement: Credit-Aware Package Catalog
The system SHALL let a verified patient browse the active wellness package catalog through a concise, decision-first page that explains the patient's current consultation credit state in plain language, presents active packages in a scannable comparison format with the original price, applied credit amount, final payable amount, included consultation credits, and checkout eligibility, and keeps any in-progress package checkout visible as supporting context so package selection remains the primary task.

#### Scenario: Eligible patient opens the package catalog
- **WHEN** a verified patient has a positive, unexpired consultation credit linked to a completed consultation
- **THEN** the system returns each active package with its original price, applied credit amount, final payable amount, included consultation credits, and an eligible checkout state in a layout that makes the next package decision clear

#### Scenario: Patient opens the package catalog with unavailable credit
- **WHEN** a verified patient has no consultation credit or only an expired or already-consumed credit
- **THEN** the system still returns the active package catalog with zero applied credit, a plain-language explanation of why checkout is unavailable, and a layout that avoids burying package choices under redundant instructional content

#### Scenario: Patient has an in-progress package checkout
- **WHEN** a verified patient already has a pending package checkout
- **THEN** the system keeps that checkout's payment state and continue action visible without replacing the core package-comparison view or implying that multiple concurrent checkouts are allowed
