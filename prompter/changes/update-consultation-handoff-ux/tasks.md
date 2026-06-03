## 1. Doctor Walk-In Start UX
- [ ] 1.1 Update the doctor queue start action so a successful `Start Consultation` request redirects to the queue in-room workspace instead of returning to the dashboard.
- [ ] 1.2 Update the doctor dashboard frontend so the start button follows the redirect without waiting for polling or requiring a second click.
- [ ] 1.3 Add regression coverage that starting an assigned walk-in redirects to `doctor.queue.workspace` and rejects unrelated doctors.

## 2. Aesthetic Treatment Line UX
- [ ] 2.1 Adjust the consultation workspace aesthetic section labels to use Treatment Name, quantity, and price terminology.
- [ ] 2.2 Ensure selected aesthetic treatment lines display the master-data selling price and calculated line total while keeping HPP hidden.
- [ ] 2.3 Preserve active-only master-data selection and quantity validation for scheduled and walk-in consultations.

## 3. Medical Record Visibility
- [ ] 3.1 Eager-load queue entries, consultation line items, and related payments for doctor medical-record consultation records.
- [ ] 3.2 Resolve patient display identity from registered patient, guest booking, or walk-in queue source before falling back to unknown.
- [ ] 3.3 Show consultation notes, intake/complaint context, Slimming Monitoring Form metrics, treatment line items, and billing status/amounts on the consultation detail page.
- [ ] 3.4 Update archive filtering/search so walk-in patient names and phone numbers are searchable.

## 4. Admin On-Site Payment Finalization
- [ ] 4.1 Add an admin-only action to mark pending internal `consultation_treatment` payments as paid with `paid_at` and audit payload metadata.
- [ ] 4.2 Surface pending consultation-treatment handoffs on the admin dashboard recent payments list with patient/source context and a paid action.
- [ ] 4.3 Ensure paid treatment handoffs appear in cash-basis revenue reports only after the admin finalizes payment.
- [ ] 4.4 Prevent finalization of non-internal, non-treatment, already-paid, failed, or unrelated payment records.

## 5. Validation
- [ ] 5.1 Add or update Laravel feature tests for walk-in redirect, medical-record identity/detail mapping, and admin treatment payment finalization.
- [ ] 5.2 Add or update React/UI coverage where available, or document manual verification for affected Inertia pages.
- [ ] 5.3 Run relevant Laravel feature tests for queue, consultation workspace, medical records, admin dashboard/payment finalization, and finance reporting.

## Post-Implementation
- [ ] Update `AGENTS.md` if the implemented behavior changes project-level domain notes or key routes.
