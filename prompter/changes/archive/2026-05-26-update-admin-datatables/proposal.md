# Change: Replace Admin Card Lists with Server-Side Data Tables

## Why
Admin pages for Users, Broadcasts, and Content currently render data as stacked card lists without sorting, column-based browsing, or server-side pagination. As datasets grow these pages become harder to scan and navigate. Converting them to TanStack-based data tables with server-side pagination provides a consistent, scalable admin UX across all three modules.

## What Changes
- Add a reusable `AdminDataTable` component wrapping `@tanstack/react-table` with server-side pagination, sorting, and per-column search wired to Inertia visits.
- Convert the Users page from stacked `UserEditorCard` cards to a data table with expandable rows for inline editing.
- Convert the Broadcasts page from stacked broadcast cards to a read-only data table (no inline editing needed; broadcasts are immutable once queued).
- Convert the Content page from stacked `ContentEditorCard` cards to a data table with expandable rows for inline editing.
- Add server-side pagination (`->paginate(15)`) to `AdminUserController::index`, `AdminBroadcastController::index`, and `AdminContentController::index`, preserving existing filter query parameters.
- Pass Inertia pagination meta (`current_page`, `last_page`, `per_page`, `total`) alongside existing props.
- **BREAKING**: None — same routes, same data, improved display.

## Impact
- Affected specs: `clinic-data-presentation`
- Affected code:
  - `resources/js/components/AdminDataTable.jsx` (new)
  - `resources/js/pages/Admin/Users.jsx`
  - `resources/js/pages/Admin/Broadcasts.jsx`
  - `resources/js/pages/Admin/Content.jsx`
  - `app/Http/Controllers/AdminUserController.php`
  - `app/Http/Controllers/AdminBroadcastController.php`
  - `app/Http/Controllers/AdminContentController.php`
