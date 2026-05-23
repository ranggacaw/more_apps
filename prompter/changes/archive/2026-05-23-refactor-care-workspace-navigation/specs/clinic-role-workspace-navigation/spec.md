## ADDED Requirements
### Requirement: Patient Workspace Primary Navigation
The system SHALL present verified patients with a simplified primary navigation and page hierarchy that distinguishes overview pages from list and detail tasks, using explicit labels for dashboard, medical records, consultation booking, packages, and profile settings so patients can move between common workflows without interpreting ambiguous or overly promotional labels.

#### Scenario: Patient opens the operational workspace on desktop or mobile
- **WHEN** a verified patient opens a patient operational page
- **THEN** the system shows the same core patient destinations with a clear current-page state and without hiding medical records or packages behind unclear labels

#### Scenario: Patient returns from a detail page to an index page
- **WHEN** a patient opens a detail page from a patient archive or catalog workflow
- **THEN** the system provides a clear return path back to the originating patient index or overview context

### Requirement: Doctor Workspace Primary Navigation
The system SHALL present verified doctors with a simplified primary navigation and page hierarchy that distinguishes dashboard overview, consultation workload, active program review, medical records, availability, and profile settings so long-form operational work is not buried inside one dashboard screen.

#### Scenario: Doctor opens the operational workspace on desktop or mobile
- **WHEN** a verified doctor opens a doctor operational page
- **THEN** the system shows the core doctor destinations with a clear current-page state and makes medical records and review work reachable without relying on dashboard anchors alone

#### Scenario: Doctor drills from overview into focused work
- **WHEN** a doctor starts on the dashboard overview and chooses a consultation, record, or review task
- **THEN** the system routes the doctor into a focused screen for that task instead of forcing unrelated workflow sections to remain visible
