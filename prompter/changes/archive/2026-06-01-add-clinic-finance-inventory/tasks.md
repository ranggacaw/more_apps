## 1. Data And Role Foundation
- [x] 1.1 Update role validation, factories, seeders, and dashboard routing to recognize `super_admin` while preserving existing `patient`, `doctor`, and `admin` behavior.
- [x] 1.2 Add a migration for `payments.return_amount`, `payments.hpp_amount`, `operating_expenses`, and `balance_sheet_entries` using integer IDR amounts consistent with existing payment storage.
- [x] 1.3 Create `OperatingExpense` and `BalanceSheetEntry` models with fillable fields, date casts, amount casts, and soft-delete handling where required.
- [x] 1.4 Update `Payment` fillable/casts to include finance reporting fields with zero defaults for existing records.

## 2. Backend Finance Workflows
- [x] 2.1 Create `FinanceReportService` to calculate P&L totals and balance-sheet totals from paid payments, expenses, and balance-sheet entries.
- [x] 2.2 Create finance report controllers for `GET /finance/profit-loss` and `GET /finance/balance-sheet` with date/as-of validation.
- [x] 2.3 Create super-admin-only controllers/actions for operating expense and balance-sheet entry create/update/delete workflows.
- [x] 2.4 Register `/finance` routes with `auth`, `verified`, and role middleware: `super_admin,doctor` for read-only reports and `super_admin` for mutations.
- [x] 2.5 Ensure `admin` users receive 403 responses for all `/finance` routes and that existing `/admin/reports` remains unchanged.

## 3. Inertia Finance UI
- [x] 3.1 Add `resources/js/Pages/Finance/ProfitLoss.jsx` with date filters and sections for revenue, returns, HPP, gross profit, gross margin, operating expenses, and net income.
- [x] 3.2 Add `resources/js/Pages/Finance/BalanceSheet.jsx` with as-of filtering, asset rows, equity/liability rows, totals, and variance display.
- [x] 3.3 Add super-admin-only finance management pages or inline forms for operating expenses and balance-sheet entries.
- [x] 3.4 Add finance navigation for super admins and read-only doctor finance links while keeping finance hidden from the existing admin navigation.
- [x] 3.5 Reuse existing UI components and `formatCurrency` conventions for responsive desktop/mobile layouts.

## 4. Tests And Validation
- [x] 4.1 Add feature tests proving super admins can view and manage finance data, doctors can view read-only reports, admins are blocked from `/finance`, and patients are blocked.
- [x] 4.2 Add report calculation tests for revenue, returns, total revenue, HPP, gross profit, gross margin, operating expenses, and net income.
- [x] 4.3 Add balance-sheet tests for manual entries, retained earnings, liabilities, total calculations, and displayed variance.
- [x] 4.4 Add request validation tests for invalid date ranges, negative amounts, unsupported balance-sheet sides, and unauthorized write attempts.
- [x] 4.5 Run `php artisan test` and `npm run build`.

## Post-Implementation
- [x] Update `AGENTS.md` with the new `super_admin` role, `/finance` routes, finance data tables, and the inventory deferral note.
