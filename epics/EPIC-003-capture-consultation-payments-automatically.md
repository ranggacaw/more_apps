# EPIC-003: Capture Consultation Payments Automatically

## Business Value Statement
This EPIC converts reserved consultations into recognized revenue and confirmed appointments. It also automates the operational steps required after payment so staff do not need to manually reconcile bookings, slots, or meeting access.

## Description
Deliver consultation checkout, Midtrans Snap payment initiation, secure webhook processing, booking and slot reconciliation, meeting-link creation, and patient confirmation notifications. The backend must treat webhook outcomes as authoritative and handle successful, pending, and failed transactions correctly.

## Source Traceability
| Document | Reference | Section/Page |
|----------|-----------|--------------|
| FSD | Consultation checkout, payment success and failure handling, booking confirmation | `more_apps_docs.md` 2.3 |
| TDD | `PaymentController@initConsultation`, webhook handler, Midtrans config, payment route, `payments` schema, `ZoomService`, notification jobs | `more_apps_docs.md` 3.1, 3.3, 3.4, 7.1, 8.1, 9 |
| Wireframe | Not provided; inferred from `Patient/Checkout.jsx` and `PaymentButton.jsx` | `more_apps_docs.md` 9 |

## Scope Definition
| In Scope | Out of Scope |
|----------|--------------|
| Consultation payment record creation with unique order ID | Package payment activation |
| Midtrans Snap token generation and frontend trigger flow | Refunds and manual payment methods |
| Signature-verified webhook processing | Invoice generation beyond payment confirmation |
| Booking confirmation and slot finalization on settlement | Financial analytics dashboards |
| Booking cancellation and slot release on failure or expiry | Subscription billing |
| Meeting-link creation and confirmation notifications | Credit deduction logic for package sales |

## High-Level Acceptance Criteria
- [ ] Consultation checkout creates a payment record with a unique Midtrans order ID and returns a Snap token for the fixed consultation fee.
- [ ] The frontend can trigger Midtrans Snap and present success, pending, error, and close states without directly deciding final booking status.
- [ ] The webhook endpoint validates Midtrans signatures before mutating any booking, payment, or slot records.
- [ ] Successful consultation payment updates the payment to paid, marks the booking confirmed, and changes the slot to booked.
- [ ] Failed, denied, cancelled, or expired consultation payments cancel the booking and release the slot back to available status.
- [ ] Confirmed consultations receive a generated meeting link plus WhatsApp and email confirmation notifications.

## Dependencies
- **Prerequisite EPICs:** EPIC-001, EPIC-002, EPIC-008
- **External Dependencies:** Midtrans Snap API, Zoom or Google Meet, Fonnte or Wablas, Mailtrap or Mailgun
- **Technical Prerequisites:** Payment schema, secure webhook route, queue workers, meeting service abstraction, outbound notification jobs

## Complexity Assessment
- **Size:** L
- **Technical Complexity:** High
- **Integration Complexity:** High
- **Estimated Story Count:** 8-10

## Risks & Assumptions
**Assumptions:**
- Midtrans webhook outcomes are the source of truth for consultation payment state.
- Consultation price is fixed at Rp 500.000 unless later changed by business policy.

**Risks:**
- Duplicate or delayed webhooks can cause repeated state transitions if idempotency rules are not enforced.
- External failures in meeting-link generation or notifications can leave paid bookings only partially fulfilled.

## Related EPICs
- **Depends On:** EPIC-001, EPIC-002, EPIC-008
- **Blocks:** EPIC-004, EPIC-005, EPIC-007
- **Related:** EPIC-002
