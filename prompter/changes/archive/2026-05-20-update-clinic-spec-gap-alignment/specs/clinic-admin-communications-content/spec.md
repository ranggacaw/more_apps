## MODIFIED Requirements
### Requirement: Queued WhatsApp Broadcast Management
The system SHALL let admins draft and dispatch WhatsApp broadcasts through the provider-oriented outbound services defined by `clinic-service-integrations`, SHALL persist each broadcast request in `whatsapp_broadcasts` and its per-recipient audit trail in `whatsapp_broadcast_deliveries`, and SHALL support only the approved audience scopes `verified_patients`, `patients`, `doctors`, `admins`, and `all_users`.

#### Scenario: Admin dispatches a valid broadcast
- **WHEN** an admin submits a valid broadcast message with one of the approved audience scopes
- **THEN** the system stores the broadcast record in `whatsapp_broadcasts`
- **AND** creates the resolved recipient delivery audit rows in `whatsapp_broadcast_deliveries`
- **AND** queues delivery work instead of sending synchronously
- **AND** exposes dispatch status for later audit and follow-up

#### Scenario: Admin submits an invalid broadcast
- **WHEN** an admin submits a broadcast without the required message content or without a supported audience scope
- **THEN** the system rejects the request and does not queue delivery work

### Requirement: Educational Content Management
The system SHALL let admins create, edit, publish, unpublish, and review educational or site content records used by clinic surfaces without code changes or direct database access, SHALL store those records in `educational_contents` with `draft` and `published` states, SHALL support an optional managed asset for each content record through the clinic asset storage flow, and SHALL make published records available on the public home page.

#### Scenario: Admin publishes new content
- **WHEN** an admin saves valid educational content with a published status
- **THEN** the system stores the content record and its publication timestamp
- **AND** makes that published content available to the intended consuming surfaces, including the public home page

#### Scenario: Admin keeps content as a draft
- **WHEN** an admin saves educational content in a draft or unpublished state
- **THEN** the system preserves the record and any managed asset for later editing without exposing it to published content surfaces
