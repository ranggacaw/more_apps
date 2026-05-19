# EPIC-005: Sell Wellness Packages with Credit

## Business Value Statement
This EPIC turns completed consultations into package revenue by applying consultation fees as a purchasable credit. It strengthens conversion while rewarding patients who move from one-time consultation into a longer-term wellness program.

## Description
Deliver the package-selection and package-payment flow that uses consultation credit, enforces eligibility rules, calculates discounted final prices, collects Midtrans payment for the remaining balance, and activates the purchased package. The workflow must prevent reused, expired, or ineligible credit applications.

## Source Traceability
| Document | Reference | Section/Page |
|----------|-----------|--------------|
| FSD | Package selection after consultation, discounted pricing, post-payment activation | `more_apps_docs.md` 2.4, 5.1 |
| TDD | `PackageController@withCredit`, package payment branch in webhook handler, `packages`, `payments`, `user_packages`, `users.consultation_credit` | `more_apps_docs.md` 3.3, 5.2, 7.1, 8.1, 9 |
| Wireframe | Not provided; inferred from `Patient/Packages.jsx` and package pricing summary | `more_apps_docs.md` 5.1, 9 |

## Scope Definition
| In Scope | Out of Scope |
|----------|--------------|
| Consultation-credit award and expiry tracking | Subscription renewals or auto-renewal |
| Package catalog with original price, applied credit, and final price | Bundle or coupon stacking |
| Eligibility validation before package payment | Offline payment reconciliation |
| Midtrans initiation for discounted package amount | Detailed meal-plan authoring |
| Package activation, credit reset, and patient notification after settlement | Full loyalty-program design |

## High-Level Acceptance Criteria
- [ ] A paid consultation creates consultation credit and an expiry window that can be evaluated during later package purchase.
- [ ] Eligible patients can browse packages with original price, credit applied, and final payable amount clearly derived from their consultation credit.
- [ ] The backend blocks package checkout when credit is missing, expired, already used, or the qualifying consultation is not completed.
- [ ] Package checkout creates a Midtrans transaction for the final amount after valid credit deduction.
- [ ] Successful package payment activates the selected package, associates it with the payment record, and resets the patient's consultation credit to zero.
- [ ] Package activation triggers a patient confirmation notification through the configured channel.

## Dependencies
- **Prerequisite EPICs:** EPIC-003, EPIC-004, EPIC-008
- **External Dependencies:** Midtrans Snap API, WhatsApp notification provider
- **Technical Prerequisites:** Package catalog, payment branching by type, credit fields on users, `user_packages` lifecycle model

## Complexity Assessment
- **Size:** L
- **Technical Complexity:** High
- **Integration Complexity:** High
- **Estimated Story Count:** 8-10

## Risks & Assumptions
**Assumptions:**
- Consultation credit is single-use and is consumed entirely on the first successful package purchase.
- Credit can reduce package price to zero but the source does not clarify whether zero-value transactions should bypass Midtrans.

**Risks:**
- The source logic requires credit award after consultation payment, but the sample consultation-payment success handler does not implement it.
- Incorrect credit validation can create revenue leakage through duplicate or expired credit use.

## Related EPICs
- **Depends On:** EPIC-003, EPIC-004, EPIC-008
- **Blocks:** EPIC-006, EPIC-007
- **Related:** EPIC-003
