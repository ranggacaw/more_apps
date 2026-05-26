## Context
Clinic staff manage a physical waiting room. Walk-in patients arrive without an online booking and must be queued, assigned to an available doctor, and tracked through the visit. The app is deployed on a VPS with a domain — both admins and doctors access it via browser on the same network. Reliability matters more than sub-second latency.

## Goals
- Admin can add walk-in patients to a digital queue with name, phone, and complaint notes
- Admin can assign a queued patient to a specific doctor
- Doctor sees their current walk-in patient on the dashboard with a "Done" button
- When doctor clicks "Done", the admin queue view updates within a few seconds
- Full audit trail of timestamps (queued, assigned, consultation started, completed)
- Works reliably with simple HTTP polling — no websockets required

## Non-Goals
- No offline-first / service-worker / PWA architecture (VPS deployment, always-connected)
- No real-time websockets (polling is sufficient for a single-clinic scenario)
- No integration with the online booking system (walk-in queue is separate from confirmed bookings)
- No patient-facing self-check-in (admin always adds patients)
- No SMS/WhatsApp notifications for queue status (in-app only)

## Decisions

### 1. Separate table from bookings
- **Decision**: `clinic_queue_entries` is a standalone table, not linked to `bookings`
- **Rationale**: Walk-in patients may not have an account or an online booking. Mixing them into `bookings` would require nullable user_id and conflict with the payment-dependent booking lifecycle. Keeping them separate keeps both flows clean.
- **Alternatives considered**: Reusing `bookings` with a `source=walk-in` flag — rejected because it couples a payment-driven lifecycle to a simple queue flow.

### 2. Polling-based admin updates
- **Decision**: Admin queue page polls every 5 seconds via a lightweight JSON endpoint
- **Rationale**: Single clinic, single admin. Polling is simple, no infrastructure complexity (no Echo, no Pusher, no Redis pub/sub). 5-second latency is acceptable for a waiting room.
- **Alternatives considered**: Laravel Echo + Pusher/Soketi — overkill for a single-clinic deployment and adds infrastructure cost.

### 3. Doctor "Done" triggers status change only
- **Decision**: Clicking "Done" sets the queue entry to `completed` and frees the doctor. No automatic assignment of the next patient — admin decides.
- **Rationale**: Admin may want to prioritize differently (urgency, patient preference, doctor specialization). Automatic assignment removes admin control.

### 4. Queue number is auto-incrementing per day
- **Decision**: Daily reset queue numbers (e.g., A001, A002 per day) for clear patient communication
- **Rationale**: Matches physical clinic expectations (take-a-number systems). Daily reset keeps numbers small and readable.

## Risks / Trade-offs
- **Polling load**: 1 admin × 1 poll every 5s = negligible server load. If scaled to many clinics, would need websockets.
- **No multi-device sync**: If two admins are on the queue page simultaneously, polling may cause stale reads for a few seconds. Acceptable for single-admin clinic.
- **No undo for "Done"**: Once a doctor marks done, the entry is completed. If accidental, admin can re-add the patient to the queue. Simpler than building undo logic.

## Data Model

### `clinic_queue_entries`
| Column | Type | Nullable | Description |
|---|---|---|---|
| id | bigint PK | No | Auto-increment |
| queue_number | string | No | Daily sequence (e.g., "Q-001") |
| patient_name | string | No | Walk-in patient name |
| patient_phone | string | Yes | Contact number |
| complaint_notes | text | Yes | Reason for visit |
| doctor_id | FK -> doctors | Yes | Assigned doctor |
| status | string | No | `waiting`, `assigned`, `in_consultation`, `completed`, `cancelled` |
| queued_at | timestamp | No | When added to queue |
| assigned_at | timestamp | Yes | When assigned to a doctor |
| consultation_started_at | timestamp | Yes | When doctor starts seeing patient |
| completed_at | timestamp | Yes | When doctor marks done |
| cancelled_at | timestamp | Yes | If removed from queue |
| created_at | timestamp | No | Laravel default |
| updated_at | timestamp | No | Laravel default |

### Status Flow
```
waiting -> assigned -> in_consultation -> completed
waiting -> cancelled
assigned -> cancelled
```

## API Endpoints

### Admin
| Method | URL | Action |
|---|---|---|
| GET | `/admin/queue` | Queue management page (Inertia) |
| GET | `/admin/queue/api` | JSON poll endpoint for live updates |
| POST | `/admin/queue` | Add patient to queue |
| PATCH | `/admin/queue/{entry}/assign` | Assign patient to a doctor |
| PATCH | `/admin/queue/{entry}/cancel` | Cancel/remove from queue |

### Doctor
| Method | URL | Action |
|---|---|---|
| GET | `/doctor/queue/api` | JSON endpoint for doctor's current patient |
| POST | `/doctor/queue/{entry}/start` | Doctor starts consultation |
| POST | `/doctor/queue/{entry}/done` | Doctor marks consultation complete |

## Open Questions
- None — scope is well-defined from user answers.
