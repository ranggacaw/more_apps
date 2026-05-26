## 1. Reusable AdminDataTable Component
- [x] 1.1 Create `resources/js/components/AdminDataTable.jsx` accepting props: `columns`, `data`, `pagination` (meta object), `onSort` callback, `onPageChange` callback, `expandableRow` optional render function
- [x] 1.2 Integrate `@tanstack/react-table` with shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` primitives
- [x] 1.3 Add clickable column headers that call `onSort(columnKey, direction)` to trigger Inertia visit with `sort_by` / `sort_dir` query params
- [x] 1.4 Add pagination controls (previous, page numbers, next) that call `onPageChange(page)` to trigger Inertia visit with `page` query param
- [x] 1.5 Add expandable row support: clicking a row toggles TanStack's `getToggleExpandedHandler` and renders the `expandableRow` sub-component when expanded

## 2. Backend Pagination
- [x] 2.1 Update `AdminUserController::index` to use `->paginate(15)` instead of `->get()`, pass pagination meta (`current_page`, `last_page`, `per_page`, `total`) alongside users data, preserve existing filter handling
- [x] 2.2 Update `AdminBroadcastController::index` to use `->paginate(15)` instead of `->take(15)->get()`, pass pagination meta alongside broadcasts data
- [x] 2.3 Update `AdminContentController::index` to use `->paginate(15)` instead of `->get()`, pass pagination meta alongside contents data

## 3. Admin Users Page
- [x] 3.1 Refactor `Admin/Users.jsx` to replace the stacked `UserEditorCard` list with `AdminDataTable`
- [x] 3.2 Define columns: name, email, phone, role, verified (badge), bookings/payments/packages counts
- [x] 3.3 Wire sorting via `onSort` calling `router.get` with `sort_by` / `sort_dir` query params
- [x] 3.4 Wire pagination via `onPageChange` calling `router.get` with `page` query param
- [x] 3.5 Move `UserEditorCard` into the expandable row renderer so clicking a user row reveals the inline editor
- [x] 3.6 Keep the existing directory-filters form and create-account form in the left panel

## 4. Admin Broadcasts Page
- [x] 4.1 Refactor `Admin/Broadcasts.jsx` to replace the stacked broadcast cards with `AdminDataTable`
- [x] 4.2 Define columns: audience scope, status (badge), recipients, sent, failed, queued date
- [x] 4.3 Wire sorting and pagination as above
- [x] 4.4 No expandable rows — broadcasts are read-only once queued
- [x] 4.5 Keep the existing broadcast queue form in the left panel

## 5. Admin Content Page
- [x] 5.1 Refactor `Admin/Content.jsx` to replace the stacked `ContentEditorCard` list with `AdminDataTable`
- [x] 5.2 Define columns: title, slug, status (badge), updated date
- [x] 5.3 Wire sorting and pagination as above
- [x] 5.4 Move `ContentEditorCard` into the expandable row renderer
- [x] 5.5 Keep the existing create-content form in the left panel

## 6. Validation
- [x] 6.1 Verify all three admin pages render data tables with correct columns and pagination controls
- [x] 6.2 Verify sorting toggles ascending/descending on each sortable column
- [x] 6.3 Verify pagination preserves existing filter parameters (Users search/role/verification)
- [x] 6.4 Verify expandable row editors submit correctly and collapse on success (Users, Content)
- [x] 6.5 Verify Broadcasts table is read-only with no expandable rows
- [x] 6.6 Run `npm run build` to confirm no build errors

## Post-Implementation
- [x] Update AGENTS.md in the project root to note admin pages now use server-side paginated data tables via `AdminDataTable` component
