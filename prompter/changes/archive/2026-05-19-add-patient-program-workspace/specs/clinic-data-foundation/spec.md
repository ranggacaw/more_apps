## ADDED Requirements

### Requirement: Weekly Program Check-In Records
The system SHALL store weekly patient progress check-ins against user packages with a package-scoped program week number derived from the package activation timestamp, weight and waist metrics, optional patient notes, an optional progress photo asset path, and doctor-review metadata including reviewer identity, review notes, and reviewed timestamp, while preserving the existing operational check-in records used for package-consumption tracking.

#### Scenario: Weekly progress submission is stored without consuming package credit
- **WHEN** a patient submits a weekly program check-in for an active package
- **THEN** the system stores the progress entry against that package with its current program week and leaves the package's remaining consultation-credit counters unchanged

#### Scenario: Doctor review metadata is stored on the weekly check-in
- **WHEN** the responsible doctor reviews a submitted weekly check-in
- **THEN** the system stores the doctor reviewer, review notes, and reviewed timestamp on that same weekly progress record

#### Scenario: Operational package check-ins remain valid
- **WHEN** an admin or clinician records an operational package check-in tied to a booking or consultation
- **THEN** the system can still store remaining-consultation tracking and related booking or consultation links without requiring weekly progress fields
