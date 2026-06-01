## ADDED Requirements
### Requirement: Profit And Loss Reporting
The system SHALL provide a finance profit and loss report for a valid start date and end date using paid `payments` records in that window as gross revenue, stored payment return amounts as returns, stored payment HPP amounts as cost of goods sold, and operating expenses dated in that window as total operating expenses. The report SHALL calculate total revenue as gross revenue minus returns, gross profit as total revenue minus HPP, gross margin as gross profit divided by total revenue when total revenue is positive, and net income as gross profit minus total operating expenses.

#### Scenario: Super admin views profit and loss for a date range
- **WHEN** a verified `super_admin` opens `/finance/profit-loss` with a valid start date and end date
- **THEN** the system shows gross revenue, returns, total revenue, HPP, gross profit, gross margin percentage, operating expenses, and net income for that date range
- **AND** the report uses paid payment timestamps and operating expense dates as the reporting source

#### Scenario: Doctor views profit and loss read-only
- **WHEN** a verified doctor opens `/finance/profit-loss` with a valid date range
- **THEN** the system shows the same calculated report values
- **AND** the page does not expose expense, HPP, return, or balance-sheet mutation controls

#### Scenario: Invalid profit and loss date range is rejected
- **WHEN** a finance report request has an end date before its start date
- **THEN** the system rejects the request and does not calculate a misleading report

#### Scenario: Empty report window returns zero values
- **WHEN** a valid date range contains no paid payments and no operating expenses
- **THEN** the system shows zero for monetary totals and zero for gross margin rather than failing

### Requirement: Balance Sheet Reporting
The system SHALL provide a finance balance sheet for a selected as-of date using cumulative paid payment cash, cumulative returns, cumulative operating expenses, cumulative net income, and manual balance-sheet entries dated on or before the selected date. The balance sheet SHALL present asset rows separately from equity and liability rows, SHALL show total assets, total equity plus liabilities, and SHALL show the variance when the simplified statement does not balance.

#### Scenario: Super admin views balance sheet as of a date
- **WHEN** a verified `super_admin` opens `/finance/balance-sheet` with an as-of date
- **THEN** the system shows cash, manual asset entries, retained earnings, manual equity entries, manual liability entries, total assets, total equity plus liabilities, and variance as of that date

#### Scenario: Doctor views balance sheet read-only
- **WHEN** a verified doctor opens `/finance/balance-sheet` with an as-of date
- **THEN** the system shows the same calculated balance-sheet rows and totals
- **AND** the page does not expose manual-entry mutation controls

#### Scenario: Imbalanced statement is visible
- **WHEN** asset totals do not equal equity plus liabilities in the simplified balance sheet
- **THEN** the system displays the variance instead of silently hiding the imbalance

### Requirement: Operating Expense Management
The system SHALL allow verified `super_admin` users to create, update, and delete operating expense records with a name, optional category, amount, expense date, and optional notes. Operating expense records SHALL be included in profit and loss reports according to their expense date and SHALL be excluded from reports after deletion.

#### Scenario: Super admin records an operating expense
- **WHEN** a verified `super_admin` submits a valid operating expense
- **THEN** the system stores the expense with its amount and expense date
- **AND** matching profit and loss reports include that amount in total operating expenses

#### Scenario: Doctor cannot manage operating expenses
- **WHEN** a verified doctor submits an operating expense mutation request
- **THEN** the system denies the request and leaves expense records unchanged

#### Scenario: Deleted expense is excluded from reports
- **WHEN** a verified `super_admin` deletes an operating expense
- **THEN** the system excludes that expense from subsequent profit and loss calculations

### Requirement: Manual Balance Sheet Entry Management
The system SHALL allow verified `super_admin` users to create, update, and delete manual balance-sheet entries with a side of `asset`, `equity`, or `liability`, a label, optional category, amount, entry date, and optional notes. Balance-sheet reports SHALL include manual entries dated on or before the selected as-of date.

#### Scenario: Super admin records initial capital
- **WHEN** a verified `super_admin` creates an equity-side entry labeled as initial capital
- **THEN** balance-sheet reports on or after the entry date include that amount on the equity side

#### Scenario: Super admin records a physical asset
- **WHEN** a verified `super_admin` creates an asset-side entry for equipment or another physical asset
- **THEN** balance-sheet reports on or after the entry date include that amount on the asset side

#### Scenario: Unsupported balance-sheet side is rejected
- **WHEN** a balance-sheet entry request uses a side other than `asset`, `equity`, or `liability`
- **THEN** the system rejects the request and leaves existing entries unchanged
