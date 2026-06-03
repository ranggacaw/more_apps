## MODIFIED Requirements
### Requirement: Consultation Aesthetic Program Selection
The system SHALL let the assigned doctor add multiple aesthetic program treatment line items through a searchable Treatment Name select input that queries active Aesthetic Program master data by program name. Selecting an aesthetic program SHALL auto-populate the treatment name and selling price into the consultation line item, SHALL let the doctor set quantity, SHALL show the calculated line price from the selling-price snapshot, and SHALL never expose HPP/COGS values to the doctor.

#### Scenario: Doctor searches active aesthetic programs
- **WHEN** the assigned doctor searches for an aesthetic program by name in the consultation workspace
- **THEN** the system returns matching active programs with id, name, and selling price only
- **AND** the response excludes HPP/COGS values

#### Scenario: Doctor selects an aesthetic treatment line
- **WHEN** the assigned doctor selects an active aesthetic program from the Treatment Name input and adds it to the consultation
- **THEN** the system displays the selected treatment name, quantity input, unit selling price, and calculated line price for that treatment line

#### Scenario: Doctor selects multiple aesthetic programs
- **WHEN** the assigned doctor selects more than one active aesthetic program during a consultation
- **THEN** the system stores one consultation line item per selected program with the selected program reference, name snapshot, selling-price snapshot, quantity, calculated line total, and dosage fields

#### Scenario: Inactive aesthetic program is excluded
- **WHEN** an aesthetic program is inactive
- **THEN** the system excludes it from doctor-facing program search and rejects new consultation line items that reference it
