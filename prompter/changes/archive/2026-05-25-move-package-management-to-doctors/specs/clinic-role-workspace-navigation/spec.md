## MODIFIED Requirements
### Requirement: Doctor Workspace Primary Navigation
The system SHALL present verified doctors with a simplified primary navigation and page hierarchy that distinguishes dashboard overview, consultation workload, active program review, medical records, package catalog management, availability, and profile settings so long-form operational work is not buried inside one dashboard screen.

#### Scenario: Doctor opens the operational workspace on desktop or mobile
- **WHEN** a verified doctor opens a doctor operational page
- **THEN** the system shows the core doctor destinations (dashboard, consultations, program reviews, medical records, packages, availability) with a clear current-page state and makes medical records, package management, and review work reachable without relying on dashboard anchors alone

#### Scenario: Doctor drills from overview into focused work
- **WHEN** a doctor starts on the dashboard overview and chooses a consultation, record, review, or package management task
- **THEN** the system routes the doctor into a focused screen for that task instead of forcing unrelated workflow sections to remain visible
