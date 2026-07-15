## ADDED Requirements
### Requirement: Patient-Visible Session Report Finalization
The system SHALL allow authorized clinical staff to capture patient-visible session report fields during consultation or session completion, including physical measurements, doctor notes, patient instructions, next-control date, and report attachments where supported, and SHALL expose the report to the patient only after an authorized doctor or super admin finalizes it.

#### Scenario: Doctor finalizes a session report
- **WHEN** an authorized doctor completes or finalizes a consultation with patient-visible metrics, notes, instructions, and next-control guidance
- **THEN** the system stores the finalized report data with the consultation/session context and makes it eligible for that patient's portal report history

#### Scenario: Draft report remains hidden from patient
- **WHEN** a session report has been saved but not finalized by an authorized finalizer
- **THEN** the patient portal does not show the report content or attachments

#### Scenario: Final report notification is queued
- **WHEN** a session report transitions from draft or hidden state to finalized patient-visible state
- **THEN** the system queues a patient notification that the visit report is available

### Requirement: Session Progress Metric Calculation
The system SHALL calculate patient progress comparisons for finalized reports using prior finalized measurements for the same patient and compatible metric, including weight, BMI, waist, hip, and other stored slimming/session measurements where available.

#### Scenario: Finalized report has prior measurements
- **WHEN** a finalized session report includes a measurement that has an earlier finalized value for the same patient
- **THEN** the patient-facing report can show the current value, previous value, and difference for that metric

#### Scenario: Finalized report has no prior measurement
- **WHEN** a finalized session report includes a measurement with no earlier finalized value for the same patient
- **THEN** the patient-facing report shows the current value without fabricating a comparison
