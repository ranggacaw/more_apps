# Change: Add Clinic Financial Statements And Super Admin Finance Access

## Why
The clinic currently has operational admin reports for paid revenue and conversion, but it does not provide finance-first managerial statements such as profit and loss or a balance sheet. The clinic needs a simplified accounting view grounded in existing payment records, manual expense entries, and manual balance-sheet entries without introducing full double-entry bookkeeping or inventory/POS scope yet.

## What Changes
- Introduce a `super_admin` role in the existing `users.role` model for finance administration while preserving existing `patient`, `doctor`, and `admin` workflows.
- Add finance statement read access for `super_admin` and `doctor`, with finance write access restricted to `super_admin`; existing `admin` users are excluded from `/finance` routes.
- Add finance data inputs for return amounts, HPP/COGS amounts, operating expenses, and manual balance-sheet entries using the existing payments-first commerce model.
- Add profit and loss and balance-sheet reporting with date/as-of filters, cash-basis calculations, and clear totals.
- Add finance navigation/workspace entries for super admins and read-only doctor navigation links.
- Defer inventory catalog, stock movement, stock valuation, product sales, and automatic stock deduction to a future proposal.

## Impact
- Affected specs: `clinic-access-control`, `clinic-data-foundation`, `clinic-financial-reporting`, `clinic-role-workspace-navigation`, `clinic-mvp`
- Affected code: `users.role` validation and routing, dashboard redirects, payment schema/model fields, new finance models/services/controllers/routes, Inertia finance pages, doctor/super-admin navigation, feature tests
- Out of scope: product inventory management, POS/product sales transactions, FIFO costing, PDF/Excel export, Spatie permission integration
