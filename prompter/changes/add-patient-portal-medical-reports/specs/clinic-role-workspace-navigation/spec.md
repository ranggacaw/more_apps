## ADDED Requirements
### Requirement: Patient Portal Navigation
The system SHALL present verified patient users with a patient portal navigation that includes dashboard, progress, medical reports, profile/password controls, and logout while excluding doctor, admin, finance, queue, and package-management staff destinations.

#### Scenario: Patient opens portal on desktop or mobile
- **WHEN** a verified patient opens a patient portal page on a supported viewport
- **THEN** the system shows patient destinations with a clear current-page state and responsive navigation suitable for desktop and mobile

#### Scenario: Patient navigation excludes staff destinations
- **WHEN** a verified patient views the portal navigation
- **THEN** the navigation does not render links to doctor, admin, finance, queue, or staff package-management workspaces
