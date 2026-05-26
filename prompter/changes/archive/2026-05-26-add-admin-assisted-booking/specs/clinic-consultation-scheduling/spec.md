## ADDED Requirements
### Requirement: Admin-Assisted Slot Locking
The system SHALL let verified admins search active doctors and reservable slots, then place exclusive 15-minute slot locks on behalf of registered patients or guest patients. Guest locking SHALL require a WhatsApp number, and admin-held locks SHALL prevent other patients or admins from reserving the same slot until the lock expires or is confirmed.

#### Scenario: Admin locks a slot for a registered patient
- **WHEN** a verified admin selects an active doctor, a future reservable slot, and a registered patient
- **THEN** the system locks the slot for 15 minutes under the admin-assisted workflow
- **AND** the slot is unavailable to other booking flows while the lock is active

#### Scenario: Admin locks a slot for a guest patient
- **WHEN** a verified admin selects an active doctor, a future reservable slot, a guest patient name, and a WhatsApp number
- **THEN** the system locks the slot for 15 minutes without requiring a patient account

#### Scenario: Guest lock without WhatsApp is rejected
- **WHEN** a verified admin attempts to lock or hold a slot for a guest patient without a WhatsApp number
- **THEN** the system rejects the request and leaves the slot reservable

### Requirement: Admin-Assisted Immediate Booking Confirmation
The system SHALL let verified admins convert an admin-held slot lock into a confirmed booking for a registered or guest patient, SHALL support `offline` and `online` consultation modes, SHALL mark the selected slot as booked immediately, and SHALL bypass patient checkout and Midtrans payment creation for admin-assisted confirmations. Patient self-service bookings SHALL continue to use the existing pending booking checkout handoff and Midtrans callback confirmation rules.

#### Scenario: Admin confirms an offline clinic booking
- **WHEN** a verified admin confirms an admin-held slot for offline consultation
- **THEN** the system creates a confirmed booking, marks the slot booked, records the offline consultation mode, and does not create a Midtrans checkout payment

#### Scenario: Admin confirms an online guest booking
- **WHEN** a verified admin confirms an admin-held slot for an online guest consultation with guest WhatsApp contact
- **THEN** the system creates a confirmed booking, marks the slot booked, records guest contact details, and marks the booking as needing a doctor-hosted meeting link

#### Scenario: Patient self-service checkout remains payment-authoritative
- **WHEN** a patient uses the existing public booking flow
- **THEN** the booking remains pending until the consultation payment callback confirms it under the existing checkout rules
