## Context
The admin side of MORE Clinic uses three pages (Users, Broadcasts, Content) that render lists of records as vertically stacked cards. Each card either displays data or provides an inline editing form. There is no pagination, sorting, or column-based browsing. `@tanstack/react-table` is already installed (v8) and the shadcn `Table` primitives are available, but no reusable datatable wrapper exists yet.

## Goals / Non-Goals

### Goals
- Provide a single reusable `AdminDataTable` component that handles server-side pagination, column sorting, and row expansion.
- Convert Users, Broadcasts, and Content admin pages to use this component.
- Preserve the existing inline editing UX via expandable table rows (Users, Content) or read-only rows (Broadcasts).
- Keep the create forms (Users, Content) and the broadcast queue form as separate panels above or beside the table.
- Server-side pagination via Laravel's `->paginate()` so the backend controls page size and the frontend stays light.

### Non-Goals
- Client-side filtering or search inside the table (search stays as server-side filter inputs above the table, as already implemented for Users).
- Changing the Queue page or Reports page (Queue is real-time polled; Reports is a metrics dashboard).
- Adding bulk actions, row selection, CSV export, or column visibility toggling in this change.
- Changing any API routes or adding new endpoints.

## Decisions

### Reusable `AdminDataTable` component
- **Decision**: Create a single shared component at `resources/js/components/AdminDataTable.jsx` that accepts column definitions, data, pagination meta, sorting state, and an optional row renderer for expandable content.
- **Alternatives considered**: Copy table boilerplate into each page (rejected — too much duplication); use a third-party datatable library on top of TanStack (rejected — TanStack + shadcn Table primitives are sufficient and already available).

### Server-side pagination via Inertia query params
- **Decision**: Controllers call `->paginate(15)` and pass the paginator meta to Inertia. The `AdminDataTable` triggers Inertia `router.get()` with updated `page`, `sort_by`, and `sort_dir` query params on page change or column header click.
- **Alternatives considered**: Client-side pagination (rejected — does not scale as datasets grow); dedicated API endpoints with fetch (rejected — Inertia visits preserve filters and flash messages naturally).

### Expandable rows for editing
- **Decision**: Use TanStack's row expansion API. The expandable sub-component renders the existing editor form inline. Clicking a row toggles expansion.
- **Alternatives considered**: Separate modal (rejected — admin workflow prefers inline editing as currently designed); separate detail page (rejected — increases navigation clicks).

### Broadcast table is read-only
- **Decision**: Broadcasts cannot be edited after creation per domain rules, so the table shows status/stats columns only. No expandable editor.

## Risks / Trade-offs
- Expandable rows with full editor forms may result in tall table rows. Mitigated by rendering a summary row and only expanding on click.
- Server-side pagination resets row expansion state on page change. Acceptable since expansion is per-session only.
- Existing filter inputs (Users) remain above the table and submit as full page visits — no change to that pattern.

## Open Questions
- None remaining.
