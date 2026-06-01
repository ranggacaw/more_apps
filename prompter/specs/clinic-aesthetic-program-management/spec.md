# clinic-aesthetic-program-management Specification

## Purpose
TBD - created by archiving change add-consultation-treatment-billing. Update Purpose after archive.
## Requirements
### Requirement: Admin Aesthetic Program Master Data Management
The system SHALL let verified admins create, list, update, deactivate, and delete eligible Aesthetic Program master data records with program name, selling price, HPP/COGS, and active/inactive status. Selling price and HPP/COGS SHALL be validated as non-negative integer Indonesian Rupiah amounts. In-use records SHALL remain available for historical consultation references even when inactive or not hard-deletable.

#### Scenario: Admin creates an aesthetic program
- **WHEN** a verified admin submits a valid aesthetic program name, selling price, HPP/COGS, and active state
- **THEN** the system stores the program and makes it available to doctor consultation search when active

#### Scenario: Admin updates an aesthetic program
- **WHEN** a verified admin changes an aesthetic program name, selling price, HPP/COGS, or active state
- **THEN** the system persists the change for future selections without mutating historical consultation line-item snapshots

#### Scenario: Admin deactivates an aesthetic program
- **WHEN** a verified admin marks an aesthetic program inactive
- **THEN** the system hides it from new doctor consultation selection while preserving historical consultation references

#### Scenario: Non-admin cannot manage aesthetic programs
- **WHEN** a patient, doctor, or unauthenticated user attempts to access aesthetic program management routes
- **THEN** the system denies access and leaves aesthetic program records unchanged

### Requirement: Aesthetic Program Margin Visibility
The system SHALL calculate gross margin for each Aesthetic Program as selling price minus HPP/COGS and SHALL display that margin in the admin master-data list. HPP/COGS and gross margin SHALL be admin-only data and SHALL NOT be exposed in doctor consultation search or doctor consultation forms.

#### Scenario: Admin views gross margin
- **WHEN** a verified admin opens the Aesthetic Program master-data page
- **THEN** the system shows each listed program with selling price, HPP/COGS, active state, and gross margin formatted in Indonesian Rupiah

#### Scenario: Doctor searches aesthetic programs
- **WHEN** a verified doctor searches active aesthetic programs from a consultation workspace
- **THEN** the system returns program name and selling price only
- **AND** the response omits HPP/COGS and gross margin values

### Requirement: Aesthetic Program Data Table Presentation
The system SHALL present Aesthetic Program master data using the existing admin data-table patterns for paginated, sortable records and inline or focused editing consistent with admin Users, Broadcasts, and Content pages.

#### Scenario: Admin sorts aesthetic programs
- **WHEN** a verified admin sorts the Aesthetic Program table by a supported column
- **THEN** the system returns paginated records ordered by that column and preserves the sort state in the page response

#### Scenario: Admin edits from the program list
- **WHEN** a verified admin edits an aesthetic program from the list view
- **THEN** the system validates and saves the update while keeping pagination and sorting behavior consistent with other admin data tables

