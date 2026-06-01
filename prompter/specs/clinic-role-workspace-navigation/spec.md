# clinic-role-workspace-navigation Specification

## Purpose
TBD - created by archiving change refactor-care-workspace-navigation. Update Purpose after archive.
## Requirements
### Requirement: Doctor Workspace Primary Navigation
The system SHALL present verified doctors with a simplified primary navigation and page hierarchy that distinguishes dashboard overview, consultation workload, active program review, medical records, package catalog management, read-only finance statements, availability, and profile settings so long-form operational work and finance review are not buried inside one dashboard screen.

#### Scenario: Doctor opens the operational workspace on desktop or mobile
- **WHEN** a verified doctor opens a doctor operational page
- **THEN** the system shows the core doctor destinations (dashboard, consultations, program reviews, medical records, packages, finance statements, availability) with a clear current-page state and makes medical records, package management, review work, and read-only finance reports reachable without relying on dashboard anchors alone

#### Scenario: Doctor drills from overview into focused work
- **WHEN** a doctor starts on the dashboard overview and chooses a consultation, record, review, package management, or finance report task
- **THEN** the system routes the doctor into a focused screen for that task instead of forcing unrelated workflow sections to remain visible

### Requirement: Super Admin Finance Workspace Navigation
The system SHALL present verified `super_admin` users with a finance workspace navigation that includes profit and loss, balance sheet, operating expenses, manual balance-sheet entries, profile settings, and logout controls. The existing admin navigation SHALL NOT render finance workspace links for `admin` users.

#### Scenario: Super admin opens the finance workspace on desktop or mobile
- **WHEN** a verified `super_admin` opens a finance page
- **THEN** the system shows finance destinations with a clear current-page state and responsive navigation suitable for desktop and mobile

#### Scenario: Admin navigation excludes finance workspace
- **WHEN** a verified admin opens the admin operational workspace
- **THEN** the admin navigation does not render `/finance` links

