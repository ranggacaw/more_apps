## MODIFIED Requirements
### Requirement: Role-Based Authentication
The system SHALL authenticate users and authorize access according to the roles `patient`, `doctor`, `admin`, and `super_admin`.

#### Scenario: Patient signs in successfully
- **WHEN** a patient submits valid credentials
- **THEN** the system grants access to patient-only features and patient dashboard data

#### Scenario: Doctor cannot access admin routes
- **WHEN** a doctor attempts to open an admin-only page
- **THEN** the system denies access to that page

#### Scenario: Super admin accesses finance routes
- **WHEN** a verified `super_admin` signs in and requests a finance route
- **THEN** the system grants access according to finance route authorization rules

#### Scenario: Admin cannot access finance routes
- **WHEN** an admin attempts to open a finance-only page
- **THEN** the system denies access to that page

### Requirement: Role-Based Dashboards
The system SHALL provide separate dashboards or workspaces for patients, doctors, admins, and super_admins, and SHALL surface the operational tools each role needs for the clinic MVP, including a doctor view of current confirmed consultations, available intake context, consultation completion actions, availability management tools, admin operational reporting, and super_admin finance statement tools.

#### Scenario: Doctor opens the doctor dashboard
- **WHEN** a doctor accesses the dashboard
- **THEN** the system shows the doctor's current confirmed consultations, the available intake context needed before completion, consultation completion actions, and availability management tools for that doctor

#### Scenario: Super admin opens the finance workspace
- **WHEN** a verified `super_admin` accesses their post-login workspace
- **THEN** the system routes them to finance statement tools rather than patient, doctor, or admin operational dashboards
