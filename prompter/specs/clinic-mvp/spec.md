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
The system SHALL authenticate users and authorize access according to the roles `patient`, `doctor`, and `admin`.

#### Scenario: Patient signs in successfully
- **WHEN** a patient submits valid credentials
- **THEN** the system grants access to patient-only features and patient dashboard data

#### Scenario: Doctor cannot access admin routes
- **WHEN** a doctor attempts to open an admin-only page
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
The system SHALL provide separate dashboards for patients, doctors, and admins.

#### Scenario: Doctor opens the doctor dashboard
- **WHEN** a doctor accesses the dashboard
- **THEN** the system shows upcoming consultations and availability management tools for that doctor

### Requirement: Notifications and Background Jobs
The system SHALL deliver booking, payment, and reminder notifications through background jobs.

#### Scenario: Reminder notification is queued
- **WHEN** a confirmed consultation reaches its reminder window
- **THEN** the system queues a WhatsApp or email notification job for delivery

