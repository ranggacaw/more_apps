## ADDED Requirements

### Requirement: Admin Data Table Component
The system SHALL provide a reusable `AdminDataTable` React component that wraps `@tanstack/react-table` with server-side pagination, column-based sorting, and optional row expansion.

#### Scenario: Admin navigates paginated data table
- **WHEN** an admin views a page using the data table component
- **THEN** the table displays rows from the current page with pagination controls showing current page, total pages, and total records

#### Scenario: Admin sorts a column
- **WHEN** an admin clicks a sortable column header
- **THEN** the system performs an Inertia visit with updated `sort_by` and `sort_dir` query parameters and the backend returns sorted results for the current page

#### Scenario: Admin expands a row for inline editing
- **WHEN** an admin clicks an expandable row in the Users or Content data table
- **THEN** the row expands to reveal the inline editor form for that record
- **AND** submitting the form updates the record and collapses the row on success

### Requirement: Admin Users Data Table
The Users admin page SHALL display user accounts in a server-side paginated data table with sortable columns (name, email, role, verification status) and expandable rows containing the inline user editor form.

#### Scenario: Admin browses and edits a user
- **WHEN** an admin visits the Users page
- **THEN** the page displays a data table paginated at 15 users per page with columns for name, email, phone, role, and verification status
- **AND** clicking a row expands to reveal the existing user editor form
- **AND** the existing create-account form and directory filters remain accessible alongside the table

#### Scenario: Admin filters users and paginates
- **WHEN** an admin applies search or role filters and then navigates to page 2
- **THEN** the filter parameters are preserved in the pagination query and the results reflect both the filters and the requested page

### Requirement: Admin Broadcasts Data Table
The Broadcasts admin page SHALL display broadcast history in a server-side paginated data table with sortable columns (audience, status, queued date, recipient count, sent count, failed count) without expandable rows.

#### Scenario: Admin views broadcast history
- **WHEN** an admin visits the Broadcasts page
- **THEN** the page displays a read-only data table paginated at 15 broadcasts per page with columns for audience scope, status, queued date, recipient count, sent count, and failed count
- **AND** the existing broadcast queue form remains accessible alongside the table

### Requirement: Admin Content Data Table
The Content admin page SHALL display educational content records in a server-side paginated data table with sortable columns (title, status, updated date) and expandable rows containing the inline content editor form.

#### Scenario: Admin browses and edits content
- **WHEN** an admin visits the Content page
- **THEN** the page displays a data table paginated at 15 records per page with columns for title, slug, status, and last updated date
- **AND** clicking a row expands to reveal the existing content editor form
- **AND** the existing create-content form remains accessible alongside the table

### Requirement: Server-Side Pagination for Admin Lists
The admin controllers for Users, Broadcasts, and Content SHALL use Laravel's `paginate()` method with a default page size of 15 and pass paginator metadata (`current_page`, `last_page`, `per_page`, `total`) to Inertia responses alongside existing record data.

#### Scenario: Controller returns paginated user data
- **WHEN** the `AdminUserController::index` action is invoked
- **THEN** the query uses `->paginate(15)` instead of `->get()` and passes `users` data and pagination metadata to the Inertia response

#### Scenario: Controller returns paginated broadcast data
- **WHEN** the `AdminBroadcastController::index` action is invoked
- **THEN** the query uses `->paginate(15)` instead of `->take(15)->get()` and passes `broadcasts` data and pagination metadata to the Inertia response

#### Scenario: Controller returns paginated content data
- **WHEN** the `AdminContentController::index` action is invoked
- **THEN** the query uses `->paginate(15)` instead of `->get()` and passes `contents` data and pagination metadata to the Inertia response

## MODIFIED Requirements

### Requirement: Sortable Data Tables
The system SHALL display tabular data using responsive data tables that support column-based sorting and server-side pagination across all admin list views.

#### Scenario: User sorts table by header
- **WHEN** a user clicks on a sortable column header in a data table
- **THEN** the system sorts the table rows based on that column's values

#### Scenario: Admin paginates through data table results
- **WHEN** an admin clicks a pagination control (next, previous, or specific page number)
- **THEN** the system performs a server request for the requested page and updates the table with the new results while preserving any active filters or sort state
