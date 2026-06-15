## MODIFIED Requirements
### Requirement: Doctor Consultation Workload View
The system SHALL show each verified doctor a compact dashboard overview of that doctor's current confirmed consultation workload, prioritizing same-day appointments and surfacing the patient identity, scheduled time, arrival readiness status, queue context when present, and summary counts needed to choose the next action quickly. Same-day in-clinic bookings SHALL become completable only after they have been checked in, called or started through the queue flow defined in `clinic-queue-management`, while online admin-assisted bookings SHALL keep the existing meeting-link readiness rules. The system SHALL also display the doctor's current and next in-clinic queue patient in a dedicated panel on the dashboard with actions defined in `clinic-queue-management`.

#### Scenario: Doctor opens the current consultation workload overview
- **WHEN** a verified doctor opens the doctor dashboard
- **THEN** the system returns only that doctor's relevant confirmed consultations in schedule order together with concise summary context and direct links into the appropriate focused workflow for each item
- **AND** the system shows the doctor's current or next in-clinic queue patient in a separate panel if one exists

#### Scenario: Same-day in-clinic booking has not arrived
- **WHEN** a same-day confirmed in-clinic booking assigned to the doctor has no booking-linked queue entry
- **THEN** the workload shows the booking as not arrived or not ready for in-room completion
- **AND** the doctor cannot complete that booking until arrival check-in and queue start succeed

#### Scenario: Unpaid or unrelated bookings are excluded from the completion workload
- **WHEN** a booking belongs to another doctor or is still pending payment confirmation
- **THEN** the system does not expose that booking as a completable consultation in the doctor's workload view

#### Scenario: Doctor has no current confirmed consultations
- **WHEN** a verified doctor opens the dashboard without any current confirmed consultations or active queue patients waiting for work
- **THEN** the system shows an empty overview state without leaving unused completion forms expanded on the dashboard

### Requirement: Consultation Completion Capture
The system SHALL let the assigned doctor complete an in-room consultation from a confirmed scheduled booking or the doctor's active walk-in queue patient by recording consultation notes or Slimming Monitoring Form details, and selecting package or treatment options to assign. Same-day in-clinic scheduled bookings SHALL require a linked queue entry in `in_consultation` status before completion, while online bookings SHALL keep the existing online readiness checks. The system SHALL persist at most one consultation record per source, generate internal billing handoffs for selected chargeable items, and SHALL transition the scheduled booking and any linked queue entry or walk-in queue entry to completed only after the consultation record and required billing records are stored successfully.

#### Scenario: Doctor completes a Slimming Program consultation with a package assignment
- **WHEN** the assigned doctor submits completion details for a confirmed scheduled booking with Slimming Monitoring Form metrics and assigns a package after any required in-clinic queue start has succeeded
- **THEN** the system stores the consultation record with the metrics, links it to the booking, patient, doctor, linked queue entry when present, and assigned package, generates a pending internal payment invoice, and marks the booking as `completed`

#### Scenario: Doctor completes a general consultation with a package assignment
- **WHEN** the assigned doctor submits completion details for a confirmed scheduled general booking with notes and assigns a package after any required in-clinic queue start has succeeded
- **THEN** the system stores the consultation notes, generates a pending internal payment invoice for the assigned package, and marks the booking as `completed`

#### Scenario: Doctor completes a booking-linked queue consultation
- **WHEN** the assigned doctor submits completion details for a confirmed scheduled booking through a linked queue entry in `in_consultation` status
- **THEN** the system stores one booking consultation record with queue traceability, stores selected treatment line items, creates pending internal treatment billing when chargeable line items exist, marks the booking as `completed`, and marks the linked queue entry as `completed`

#### Scenario: Doctor completes a walk-in in-room consultation
- **WHEN** the assigned doctor submits completion details for their `in_consultation` walk-in queue entry with notes, Slimming Monitoring Form metrics, selected slimming options, or selected aesthetic programs
- **THEN** the system stores one queue-originated consultation record, stores selected treatment line items, creates pending internal treatment billing when chargeable line items exist, and marks the queue entry as `completed`

#### Scenario: Doctor cannot complete another doctor's or a non-active consultation source
- **WHEN** a doctor attempts to complete a scheduled booking assigned to a different doctor, a booking that is not `confirmed`, a same-day in-clinic booking without a linked queue entry in `in_consultation` status, a no-show booking, a walk-in queue entry assigned to a different doctor, or a queue entry that is not `in_consultation`
- **THEN** the system rejects the completion attempt and leaves booking, queue, consultation, and billing records unchanged
