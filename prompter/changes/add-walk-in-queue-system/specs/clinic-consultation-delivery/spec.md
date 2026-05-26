## MODIFIED Requirements

### Requirement: Doctor Consultation Workload View
The system SHALL show each verified doctor a compact dashboard overview of that doctor's current confirmed consultation workload, prioritizing same-day appointments and surfacing the patient identity, scheduled time, readiness status, and summary counts needed to choose the next action quickly, and SHALL provide drill-in actions from that overview into focused consultation or review workspaces instead of rendering every operational form inline on the dashboard. The system SHALL also display the currently assigned walk-in queue patient (if any) in a dedicated panel on the dashboard with patient details and "Start Consultation" / "Done" actions as defined in `clinic-queue-management`.

#### Scenario: Doctor opens the current consultation workload overview
- **WHEN** a verified doctor opens the doctor dashboard
- **THEN** the system returns only that doctor's relevant confirmed consultations in schedule order together with concise summary context and direct links into the appropriate focused workflow for each item
- **AND** the system shows the doctor's currently assigned walk-in queue patient in a separate panel if one exists

#### Scenario: Unpaid or unrelated bookings are excluded from the completion workload
- **WHEN** a booking belongs to another doctor or is still pending payment confirmation
- **THEN** the system does not expose that booking as a completable consultation in the doctor's workload view

#### Scenario: Doctor has no current confirmed consultations
- **WHEN** a verified doctor opens the dashboard without any current confirmed consultations waiting for work
- **THEN** the system shows an empty overview state without leaving unused completion forms expanded on the dashboard
