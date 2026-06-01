# Change: Add Consultation Treatment Billing

## Why
The doctor consultation workspace currently captures notes, an optional meal plan, and one recommended package, but it does not support treatment-level dosage, structured aesthetic program selections, consultation-room trial/package choices, or an automatic billing handoff. The clinic needs doctors to record treatment details during the visit while admins retain control of master data, clinic hours, and financial visibility.

## What Changes
- Add doctor-only consultation treatment line items with dosage value/unit, quantity, notes, warning-only empty dosage handling, and per-line price snapshots.
- Add consultation-room slimming trial/package selection for Basic, Advanced, and Diamond options, including Diamond oral medication as an optional add-on only when a Diamond primary option is selected.
- Add admin-managed Aesthetic Program master data with price, HPP/COGS, active state, and gross margin display; expose only active program names/prices to doctors through searchable selection.
- Create pending internal `payments` records from completed consultations when chargeable treatment/package/program line items are selected, rather than adding a separate invoice module.
- Add configurable clinic operating hours with default weekday/weekend windows, dynamic slot display, booking rejection outside hours, and audited admin schedule overrides.
- Keep dosage editing doctor-only and avoid introducing a new medical staff role in this change.

## Impact
- Affected specs: `clinic-consultation-delivery`, `clinic-data-foundation`, `clinic-consultation-scheduling`, `clinic-aesthetic-program-management`, `clinic-package-commerce`
- Affected code: consultation completion controller and workspace, consultation/payment/package/aesthetic-program models and migrations, `TimeSlotService`, patient/admin booking controllers and pages, admin navigation and master-data pages, finance/payment reporting touchpoints, seeders, feature tests
- Out of scope: a separate invoice module, payment collection or mark-paid workflows for consultation-originated bills, new non-doctor medical staff roles, inventory/POS stock deduction, automatic FIFO costing, and package settlement into `user_packages` without a separate payment-completion flow
