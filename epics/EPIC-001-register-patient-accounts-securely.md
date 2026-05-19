# EPIC-001: Register Patient Accounts Securely

## Business Value Statement
This EPIC enables new patients to create verified accounts and access the clinic platform without staff intervention. It supports patient acquisition while protecting downstream booking, payment, and health data workflows behind verified access.

## Description
Deliver self-service registration, OTP verification, session-based login, and logout for patient users. The flow must create unverified accounts, trigger OTP delivery, validate verification attempts, and gate patient-only areas until verification is complete.

## Source Traceability
| Document | Reference | Section/Page |
|----------|-----------|--------------|
| FSD | Patient registration, OTP verification, login, auto-login redirect | `more_apps_docs.md` 2.1 |
| TDD | Auth stack, `users` schema, auth routes, `SendOtpJob` | `more_apps_docs.md` 1, 7.1, 8.1, 9 |
| Wireframe | Not provided; inferred from `resources/js/Pages/Auth/Register.jsx`, `VerifyOtp.jsx`, `Login.jsx` | `more_apps_docs.md` 9 |

## Scope Definition
| In Scope | Out of Scope |
|----------|--------------|
| Patient registration form with validation | Social login |
| Account creation with `verified = false` default | Password reset and account recovery |
| OTP dispatch and expiry validation | Staff account provisioning workflows |
| Verification success path with automatic login | Multi-factor authentication beyond onboarding OTP |
| Login, logout, and verified route gating | Profile editing after onboarding |

## High-Level Acceptance Criteria
- [ ] Guests can register with unique name, email, phone number, and password, and invalid data is rejected with clear validation outcomes.
- [ ] New patient accounts are stored as unverified and trigger OTP delivery through the configured notification channel.
- [ ] Patients can submit OTP codes that are checked for validity and expiry before their account is marked verified.
- [ ] Successful OTP verification automatically signs the patient in and redirects them to the patient dashboard.
- [ ] Unverified or unauthenticated users cannot access patient-only routes, and authenticated users can log out cleanly.

## Dependencies
- **Prerequisite EPICs:** EPIC-008
- **External Dependencies:** Fonnte or Wablas for WhatsApp OTP, Mailtrap or Mailgun if email OTP fallback is used
- **Technical Prerequisites:** `users` table, queue-backed notification jobs, auth and verified middleware

## Complexity Assessment
- **Size:** M
- **Technical Complexity:** Medium
- **Integration Complexity:** Medium
- **Estimated Story Count:** 6-8

## Risks & Assumptions
**Assumptions:**
- OTP is the primary verification mechanism for patient onboarding.
- Laravel session auth remains the single sign-in mechanism for the Inertia application.

**Risks:**
- OTP delivery reliability can block first-time conversions if the messaging provider is unstable.
- The source document does not define resend, retry-limit, or lockout behavior for failed OTP attempts.

## Related EPICs
- **Depends On:** EPIC-008
- **Blocks:** EPIC-002, EPIC-003, EPIC-005, EPIC-006
- **Related:** EPIC-007
