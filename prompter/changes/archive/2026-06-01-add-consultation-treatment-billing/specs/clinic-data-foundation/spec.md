## ADDED Requirements
### Requirement: Aesthetic Program And Package Option Master Data
The system SHALL persist admin-managed Aesthetic Program master data with program name, integer IDR selling price, integer IDR HPP/COGS, active state, timestamps, and deletion state where needed to preserve historical references. The system SHALL persist consultation package-option master data for selectable slimming trial/package/add-on options with program family, option type, name, selling price, injection frequency, duration label or days, active state, add-on eligibility rules, and sort order. Historical consultation line items SHALL retain name and price snapshots when master records change or become inactive.

#### Scenario: Master data stores financial values as IDR integers
- **WHEN** an admin saves an aesthetic program or consultation package option
- **THEN** the system stores price and HPP/COGS values as integer Indonesian Rupiah amounts consistent with existing payment storage

#### Scenario: Historical consultation retains snapshots
- **WHEN** a selected aesthetic program or package option is later renamed, repriced, deactivated, or deleted where allowed
- **THEN** existing consultation line items keep the original submitted name, price, dosage, and option metadata snapshots

### Requirement: Consultation Treatment Line Item Data
The system SHALL persist consultation treatment line items separately from the parent consultation so each completed consultation can store multiple aesthetic programs, one primary slimming package option, optional add-ons, manual treatment details where supported by the UI, quantity, dosage value, dosage unit defaulting to `ml`, notes, selling-price snapshot, HPP snapshot when available to admin/finance, attending doctor identity through the consultation, and creation/update timestamps.

#### Scenario: Consultation stores multiple line items
- **WHEN** a doctor completes a consultation with multiple aesthetic program selections and one selected package option
- **THEN** the system stores each selection as a distinct line item linked to the single consultation record

#### Scenario: Dosage unit is omitted
- **WHEN** a submitted line item has a dosage value but no dosage unit
- **THEN** the system stores `ml` as the dosage unit for that line item

### Requirement: Consultation-Originated Billing Payment Data
The system SHALL persist consultation-originated billing handoff records in `payments` using a distinct internal payment type/provider, a unique internal order identifier, pending status by default, booking and consultation linkage, total integer IDR amount, total HPP amount where available, payload snapshots of selected billing line items, and nullable user linkage where the source booking is a guest booking. These records SHALL NOT be treated as Midtrans checkout attempts.

#### Scenario: Registered consultation creates billing payment
- **WHEN** a completed registered-patient consultation has chargeable treatment line items
- **THEN** the system stores a pending internal payment linked to the user, booking, consultation, and selected line-item snapshots

#### Scenario: Guest consultation creates billing payment
- **WHEN** a completed guest consultation has chargeable treatment line items
- **THEN** the system stores a pending internal payment linked to the booking and consultation with no user account requirement
- **AND** display identity can still be resolved from the booking guest fields

#### Scenario: Internal payment is excluded from provider callbacks
- **WHEN** Midtrans sends a callback for provider-backed payment processing
- **THEN** consultation-originated internal payment records are not processed as Midtrans payments and are not mutated by unrelated callback payloads

### Requirement: Clinic Hours And Override Data
The system SHALL persist clinic operating-hour settings and schedule override audits in database tables rather than hardcoded constants. Operating-hour settings SHALL support day-of-week, start time, end time, active state, and timestamps. Schedule override audit records SHALL store admin identity, doctor identity, affected date/time or slot, optional booking identity, reason, and timestamps.

#### Scenario: Default clinic hours are seeded
- **WHEN** the clinic schedule seed runs
- **THEN** weekday operating-hour records exist for 16:00 to 20:00 and weekend operating-hour records exist for 10:00 to 20:00

#### Scenario: Admin override is audited
- **WHEN** an admin creates or confirms a booking outside configured clinic hours through an override flow
- **THEN** the system stores the override reason, admin, doctor, affected time, and related booking or slot reference for later audit
