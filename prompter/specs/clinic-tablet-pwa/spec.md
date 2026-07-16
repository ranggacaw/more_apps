# clinic-tablet-pwa Specification

## Purpose
TBD - created by archiving change add-tablet-pwa-support. Update Purpose after archive.
## Requirements
### Requirement: Tablet PWA Installability
The system SHALL expose tablet-compatible Progressive Web App metadata so supported iPadOS and Android tablet browsers can install the clinic application with MORÉ branding and launch it in standalone display mode.

#### Scenario: Tablet browser discovers install metadata
- **WHEN** a tablet browser loads the app shell
- **THEN** the response includes a Web App Manifest link, theme metadata, Apple mobile web app metadata, and icon links suitable for tablet install prompts or add-to-home-screen flows

#### Scenario: Installed app launches to the role workspace
- **WHEN** a user opens the installed PWA from the tablet home screen
- **THEN** the app starts within the application scope at `/dashboard` and follows the existing authentication and role-based dashboard routing

### Requirement: Safe Offline PWA Runtime
The system SHALL provide a service worker that improves static asset resilience while preserving server authority for authenticated clinical, queue, booking, finance, payment, and account workflows.

#### Scenario: Navigation fails while offline
- **WHEN** a tablet user navigates while the network is unavailable
- **THEN** the service worker serves a branded offline fallback page that explains network access is required for clinic actions

#### Scenario: Operational requests remain network-only
- **WHEN** the app makes non-GET requests, JSON/API polling requests, signed clinic asset requests, payment requests, or other authenticated workflow requests
- **THEN** the service worker does not satisfy those requests from stale cache and lets the network/server response determine the result

#### Scenario: Static assets are available after reload
- **WHEN** the app has previously loaded static build assets, icons, manifest data, or the offline fallback
- **THEN** the service worker can reuse cached static assets to improve reload resilience without caching mutable operational data

### Requirement: Tablet Standalone Role Workspaces
The system SHALL keep the admin, doctor, and patient portals usable on tablets and in installed standalone display mode with touch-friendly navigation, safe spacing, and responsive workflow layouts.

#### Scenario: Admin uses tablet operations
- **WHEN** an admin opens queue, booking, invoice, user, content, or reporting workspaces from a tablet or installed PWA
- **THEN** navigation, tables, pagination, forms, and action controls remain readable and tappable without blocking core operations

#### Scenario: Doctor uses tablet clinical workflows
- **WHEN** a doctor opens queue, consultation, medical record, package, or program review workspaces from a tablet or installed PWA
- **THEN** clinical context, forms, treatment inputs, and completion actions remain readable and tappable without requiring desktop-only layout assumptions

#### Scenario: Patient uses tablet portal
- **WHEN** a patient opens dashboard, progress, report, or medical record portal pages from a tablet or installed PWA
- **THEN** portal navigation, care cards, reports, and metric summaries remain readable and tappable in tablet portrait and landscape use

