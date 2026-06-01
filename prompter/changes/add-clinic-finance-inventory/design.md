## Context
The current Laravel/Inertia clinic app stores roles in `users.role` and supports `patient`, `doctor`, and `admin`. Paid consultation and package revenue is stored in `payments` with `amount`, `type`, `status`, and `paid_at`; there is no `transactions` table, product-sales flow, or inventory model. Existing `/admin/reports` pages provide operational revenue and conversion metrics for admins, but the requested finance statements require a separate finance workspace and a new `super_admin` role.

## Goals / Non-Goals
- Goals: provide profit and loss reporting, balance-sheet reporting, operating-expense management, manual balance-sheet entries, and role-scoped finance access.
- Goals: keep the implementation aligned with the existing payments-first data model and current role middleware instead of adding a permission package.
- Non-Goals: implement product inventory, stock movements, POS/product sale transactions, automatic stock deduction, FIFO costing, exports, or full double-entry accounting.
- Non-Goals: remove the existing admin operational reports; `/admin/reports` remains an operational module distinct from the new `/finance` statements.

## Decisions
- Decision: Add `super_admin` as a first-class `users.role` value and continue using the existing role middleware.
- Alternatives considered: adding Spatie permissions or reusing `admin` for finance. Spatie is not installed and would broaden the change; reusing `admin` conflicts with the requested admin exclusion.

- Decision: Keep finance statements under a new `/finance` route namespace.
- Alternatives considered: expanding `/admin/reports`. A separate namespace keeps admin operational reporting distinct from finance statements and makes admin exclusion explicit.

- Decision: Derive gross revenue from paid `payments` and add `return_amount` and `hpp_amount` fields to payments for simplified cash-basis P&L calculations.
- Alternatives considered: introducing a new `transactions` table. The current app has no transaction model and already treats `payments` as the source of commerce truth.

- Decision: Store operating expenses and balance-sheet entries in dedicated manual-entry tables.
- Alternatives considered: hard-coding balance-sheet rows or deriving every row from payments. Manual entries are required for initial capital, liabilities, physical/non-physical assets, supplier PO values, and expenses not represented in payment records.

- Decision: Show balance-sheet variance instead of forcing double-entry balance.
- Alternatives considered: enforcing double-entry journal posting. A simplified managerial balance sheet matches the requested MVP and avoids adding an accounting ledger.

## Risks / Trade-offs
- Risk: Adding `super_admin` changes the role model and validation lists across the app. Mitigation: update access-control specs, route authorization, dashboard redirects, role filters, seeders/factories, and tests together.
- Risk: Doctors receive read-only finance visibility. Mitigation: enforce separate route groups for read-only reports and `super_admin`-only write actions, with tests proving doctors cannot mutate finance records.
- Risk: HPP and returns are manual values until inventory/POS exists. Mitigation: default both to zero and document that inventory-driven COGS is deferred.
- Risk: Admins still have existing operational revenue reports. Mitigation: define those reports as operational metrics, while `/finance` contains the restricted accounting statements.

## Migration Plan
- Add nullable/defaulted finance fields to `payments` so existing payment rows remain valid with zero returns and zero HPP.
- Create `operating_expenses` and `balance_sheet_entries` with date fields for report filtering.
- Seed or document at least one verified `super_admin` account so the new finance workspace is reachable after deployment.
- Back out by removing finance routes/pages and dropping the added finance tables/columns if the proposal is not implemented.

## Open Questions
- None for this proposal. Inventory and automatic stock deduction are intentionally deferred.
