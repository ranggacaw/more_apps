## Context
EPIC-001 defines patient onboarding as a self-service flow that creates an unverified account, dispatches an OTP, verifies the code, then starts a session and redirects the patient to the dashboard. The current application already has session auth, patient-only registration, verified middleware on operational routes, and a provider-based WhatsApp service, but the auth implementation still uses Laravel's email-link verification flow through `routes/auth.php`, `VerifyEmailController`, `VerifyEmail.jsx`, and `ClinicVerifyEmail`.

The proposal needs to preserve the existing access-control model while changing the patient verification mechanism to match the documented OTP-first journey in `docs/more_apps_docs.md`. It also needs to stay compatible with the queue-backed notification requirements already captured in `clinic-background-automation`.

## Goals / Non-Goals
- Goals:
  - Define a patient onboarding capability that covers registration, OTP verification, session login, and logout.
  - Reuse the platform's existing verified-route gate so OTP verification becomes the way self-registered patients satisfy that requirement.
  - Keep OTP delivery asynchronous and provider-oriented so the implementation can build on the current notification stack.
- Non-Goals:
  - Add password reset, account recovery, or broader multi-factor authentication.
  - Define resend limits, brute-force lockouts, or alternate fallback channels beyond what this epic explicitly requires.
  - Redesign unrelated patient, doctor, or admin application flows outside onboarding and auth entry points.

## Decisions
- Decision: Introduce a dedicated `clinic-patient-authentication` capability instead of overloading `clinic-mvp` or `clinic-access-control` with all onboarding detail.
  - Alternatives considered: Expanding `clinic-mvp` would bury OTP-specific behavior inside a broad MVP spec, and expanding only `clinic-access-control` would mix route-authorization concerns with registration and login behavior.
- Decision: Treat OTP verification as the mechanism that satisfies the existing verified-account gate for self-registered patients.
  - Alternatives considered: Adding a second, OTP-specific access flag would duplicate the current verification concept and increase implementation complexity without product benefit.
- Decision: Keep Laravel session auth for login and logout, but replace the current patient email-link verification journey with an OTP verification experience.
  - Alternatives considered: Keeping email verification in parallel for onboarding would conflict with the chosen OTP-primary scope and create ambiguous user flows.
- Decision: Leave resend, retry-limit, and lockout behavior out of scope for this change.
  - Alternatives considered: Defining those controls now would require inventing product rules that are explicitly called out as unspecified in the epic.

## Risks / Trade-offs
- The current framework scaffolding and tests assume email-link verification, so the eventual implementation will need to refactor or replace those expectations without weakening route protection.
- OTP persistence can be modeled in more than one way, and this proposal intentionally leaves the exact storage shape to implementation as long as expiry and validation behavior are covered.
- Not defining resend or lockout behavior keeps the proposal aligned to the epic, but it also leaves some abuse-prevention work for a follow-up change.

## Migration Plan
1. Define the new patient-authentication capability and the related access-control and queue deltas first.
2. Implement the OTP verification state and registration flow changes before replacing the verification UI.
3. Migrate auth tests from email-verification assumptions to OTP-verification expectations.
4. Re-run auth and access-control validation after the new flow is in place.

## Open Questions
- None for proposal approval. OTP is confirmed as the primary patient verification path for this change.
