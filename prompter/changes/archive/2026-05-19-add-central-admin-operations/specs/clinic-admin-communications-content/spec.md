## ADDED Requirements
### Requirement: Queued WhatsApp Broadcast Management
The system SHALL let admins draft and dispatch WhatsApp broadcasts through the provider-oriented outbound services defined by `clinic-service-integrations`, and SHALL store an audit trail for each broadcast attempt.

#### Scenario: Admin dispatches a valid broadcast
- **WHEN** an admin submits a valid broadcast message with an approved audience scope
- **THEN** the system stores the broadcast record
- **AND** queues delivery work instead of sending synchronously
- **AND** exposes dispatch status for later audit and follow-up

#### Scenario: Admin submits an invalid broadcast
- **WHEN** an admin submits a broadcast without the required message content or without a supported audience scope
- **THEN** the system rejects the request and does not queue delivery work

### Requirement: Educational Content Management
The system SHALL let admins create, edit, publish, unpublish, and review educational or site content records used by clinic surfaces without code changes or direct database access.

#### Scenario: Admin publishes new content
- **WHEN** an admin saves valid educational content with a published status
- **THEN** the system stores the content record and makes it available to the intended consuming surface

#### Scenario: Admin keeps content as a draft
- **WHEN** an admin saves educational content in a draft or unpublished state
- **THEN** the system preserves the record for later editing without exposing it to published content surfaces
