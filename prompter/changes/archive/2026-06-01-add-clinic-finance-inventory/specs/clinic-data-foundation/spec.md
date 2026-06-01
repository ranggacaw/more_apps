## ADDED Requirements
### Requirement: Finance Statement Data Model
The system SHALL persist simplified finance statement inputs without requiring an inventory or POS transaction model, including zero-default return and HPP amounts on payment records, operating expense records, and manual balance-sheet entries. Monetary finance values SHALL use the same integer IDR storage convention as existing payment amounts.

#### Scenario: Existing payments receive finance defaults
- **WHEN** the finance statement migration is applied to existing payment records
- **THEN** each payment has return and HPP fields available with zero defaults
- **AND** existing payment, booking, and package checkout history remains valid

#### Scenario: Operating expense input is stored for reporting
- **WHEN** a valid operating expense is saved
- **THEN** the system stores its name, optional category, integer amount, expense date, optional notes, timestamps, and deletion state needed for P&L reporting

#### Scenario: Manual balance-sheet input is stored for reporting
- **WHEN** a valid balance-sheet entry is saved
- **THEN** the system stores its side, label, optional category, integer amount, entry date, optional notes, and timestamps needed for as-of balance-sheet reporting

#### Scenario: Inventory data is not required for finance-first reports
- **WHEN** the finance statement reports are calculated before inventory management exists
- **THEN** the system uses payment HPP values and manual entries rather than requiring product, stock movement, or sale-line tables
