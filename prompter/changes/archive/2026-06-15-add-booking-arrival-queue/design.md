## Context
`docs/fitur-antrian-klinik.md` describes a two-stage workflow: patients book for a date first, then receive a queue number only when they arrive at the clinic. The app already has `bookings` for appointments and `clinic_queue_entries` for walk-in queue patients, so the minimal path is to extend the existing queue table rather than introduce a new `appointments` table.

Current behavior also lets doctors complete confirmed scheduled bookings directly from the consultation workload. For in-clinic same-day operations, booking-linked consultations need to pass through arrival check-in and queue progression before completion, while online admin-assisted bookings should remain outside the physical arrival queue.

## Goals / Non-Goals
- Goals: support same-day check-in for confirmed offline bookings, assign queue numbers by arrival order, unify booked arrivals and walk-ins in the admin and doctor queue views, preserve existing walk-in consultation billing behavior.
- Non-Goals: create a separate `appointments` table, replace existing booking/payment confirmation rules, add patient self-service queue pages, add public TV/QR displays, add WhatsApp/SMS queue notifications, or add WebSocket real-time infrastructure.

## Decisions
- Decision: reuse `bookings` as the appointment source and add a nullable `booking_id` plus source metadata to `clinic_queue_entries`.
- Alternatives considered: creating an `appointments` table as shown in the external document. This duplicates the app's existing `bookings` model and would require broader migration and payment changes.

- Decision: store a queue date and numeric daily sequence on `clinic_queue_entries`, while preserving the existing human-readable `queue_number` display value.
- Alternatives considered: continue deriving the next number from today's row count. That is unsafe under concurrent check-ins and can duplicate numbers when rows are cancelled or created simultaneously.

- Decision: make booking check-in create exactly one booking-linked queue entry, with the booking's assigned doctor copied onto the queue entry.
- Alternatives considered: adding queue fields directly to `bookings`. A separate queue ledger preserves walk-in behavior and provides one active operational source for admin and doctor queue screens.

- Decision: booking-linked queue entries use the scheduled booking consultation workspace and completion path, while walk-ins keep using the queue-originated workspace.
- Alternatives considered: treat booked arrivals as guest walk-ins. That would lose registered or guest booking identity, payment context, and booking completion semantics.

## Data Model Notes
- `clinic_queue_entries` should gain enough fields to distinguish `walk_in` and `booking` sources, link to a booking when present, and sort safely by daily queue order.
- A booking-linked queue entry should be unique per booking.
- Daily queue sequence uniqueness should be enforced at the database level for the queue date.
- Queue number allocation should happen inside a database transaction that locks the relevant daily queue sequence before inserting a new row.

## Risks / Trade-offs
- Risk: same-day offline bookings may currently be completable before arrival. Mitigation: add explicit guards so in-clinic booking completion requires a linked queue entry in consultation state.
- Risk: concurrent admin check-ins can allocate duplicate numbers. Mitigation: use transaction locking and a unique daily sequence constraint.
- Risk: changing doctor workload readiness may surprise users. Mitigation: show not-arrived and checked-in states clearly, while keeping online booking completion rules unchanged.

## Migration Plan
1. Add queue source/link/order fields with nullable defaults so existing walk-in rows remain valid.
2. Backfill existing queue rows as `walk_in` with queue date derived from `queued_at` or `created_at`.
3. Update code paths to use the transactional allocator for both existing walk-in creation and new booking check-in.
4. Add feature tests before enabling the new admin and doctor queue controls.

## Open Questions
- Should doctors be allowed to call the next checked-in booking directly, or should admins remain responsible for moving queue entries from waiting to called/assigned? The proposal assumes doctors can call/start their own next queued patient, while admins still manage walk-in doctor assignment.
