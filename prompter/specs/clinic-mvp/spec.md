# clinic-mvp Specification

## Purpose
TBD - created by archiving change add-more-clinic-platform-mvp. Update Purpose after archive.
## Requirements
### Requirement: Responsive Clinic Access
The system SHALL provide a responsive web application for patients, doctors, and admins that works from desktop and mobile browsers.

#### Scenario: Patient uses a mobile browser
- **WHEN** a patient opens the application on a phone browser
- **THEN** the patient can complete registration, booking, and payment without requiring a native mobile app

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

### Requirement: Doctor Availability and Booking
The system SHALL allow doctors to manage availability and patients to reserve consultation slots.

#### Scenario: Patient books an available slot
- **WHEN** a patient selects an available doctor slot and confirms the booking
- **THEN** the system creates a pending booking and locks the selected slot for that patient

### Requirement: Consultation Payment Processing
The system SHALL initiate consultation payments and confirm payment outcomes through Midtrans.

#### Scenario: Consultation payment succeeds
- **WHEN** Midtrans confirms a successful consultation payment
- **THEN** the system marks the payment as paid and confirms the related booking

### Requirement: Role-Based Dashboards
The system SHALL provide separate dashboards or workspaces for patients, doctors, admins, and super_admins, and SHALL surface the operational tools each role needs for the clinic MVP, including a doctor view of current confirmed consultations, available intake context, consultation completion actions, availability management tools, admin operational reporting, and super_admin finance statement tools.

#### Scenario: Doctor opens the doctor dashboard
- **WHEN** a doctor accesses the dashboard
- **THEN** the system shows the doctor's current confirmed consultations, the available intake context needed before completion, consultation completion actions, and availability management tools for that doctor

#### Scenario: Super admin opens the finance workspace
- **WHEN** a verified `super_admin` accesses their post-login workspace
- **THEN** the system routes them to finance statement tools rather than patient, doctor, or admin operational dashboards

### Requirement: Notifications and Background Jobs
The system SHALL deliver booking, payment, and reminder notifications through background jobs.

#### Scenario: Reminder notification is queued
- **WHEN** a confirmed consultation reaches its reminder window
- **THEN** the system queues a WhatsApp or email notification job for delivery

