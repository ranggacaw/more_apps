# Change: Refactor Tables to Shadcn Data Table

## Why
The current application uses standard HTML tables which lack advanced features like sorting, filtering, and responsive design. Upgrading to Shadcn Data Table (powered by TanStack React Table) will make the tables simpler to maintain, cooler, modern, and provide out-of-the-box sorting based on table headers.

## What Changes
- Install `@tanstack/react-table` dependency.
- Add Shadcn `Table` UI components.
- Refactor existing HTML tables in Patient, Doctor, and Admin views into Shadcn Data Tables.
- Implement column sorting functionality.
- **BREAKING**: None

## Impact
- Affected specs: `clinic-data-presentation`
- Affected code: `resources/js/Pages/Admin/Reports.jsx`, `resources/js/Pages/Doctor/MedicalRecords.jsx`, `resources/js/Pages/Patient/MedicalRecords.jsx`, `resources/js/Pages/Patient/Packages.jsx`
