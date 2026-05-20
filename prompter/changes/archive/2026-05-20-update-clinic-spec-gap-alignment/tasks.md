## 1. Specification Updates
- [x] 1.1 Update `clinic-patient-authentication` to make the self-registered patient verification flow explicitly WhatsApp-based and routed through `/verify-otp`.
- [x] 1.2 Update `clinic-admin-communications-content` to capture the approved WhatsApp broadcast scopes, delivery audit persistence, managed assets, and public home-page publishing behavior.
- [x] 1.3 Update `clinic-admin-user-administration` to capture admin-controlled verification state and inactive doctor-profile preservation during role changes.
- [x] 1.4 Update `clinic-service-integrations` to state that consultation checkout always initializes from `clinic.consultation_fee`.
- [x] 1.5 Update `clinic-background-automation` to capture weekly reminder deduplication in `user_packages.metadata`.

## 2. Validation
- [x] 2.1 Review the updated requirement wording against `docs/more_apps_docs.md`, `AGENTS.md`, and the representative controller and service behavior already in the repo.
- [x] 2.2 Run `prompter validate update-clinic-spec-gap-alignment --strict --no-interactive`.
