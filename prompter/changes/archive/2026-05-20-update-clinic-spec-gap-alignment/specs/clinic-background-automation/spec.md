## MODIFIED Requirements
### Requirement: Active Program Engagement Notifications
The system SHALL queue weekly patient check-in reminders for active packages and SHALL queue patient follow-up notifications after a doctor reviews a weekly check-in, using the same queued outbound notification pattern as the rest of the clinic notification flows. The system SHALL record weekly reminder deduplication state in `user_packages.metadata` so the same program week is not re-queued repeatedly once a reminder has already been scheduled.

#### Scenario: Active package reaches a due weekly check-in window
- **WHEN** an active package enters a new seven-day program week and the patient has not yet submitted that week's check-in
- **THEN** the scheduler queues a weekly reminder notification for that package without sending it inline from a web request
- **AND** records that reminded week in `user_packages.metadata`

#### Scenario: Reminder for the same program week is not queued twice
- **WHEN** an active package already records the current program week as reminded in `user_packages.metadata`
- **THEN** the scheduler does not queue another weekly reminder for that same week

#### Scenario: Doctor review triggers patient follow-up
- **WHEN** the responsible doctor records review notes for a patient's weekly check-in
- **THEN** the system queues a patient-facing follow-up notification that the latest weekly review is available
