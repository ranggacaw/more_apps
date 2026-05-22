## Context
The current patient and doctor experiences already expose the required domain data, but several pages collapse too many responsibilities into one surface:
- `resources/js/Pages/Patient/MedicalRecords.jsx` keeps list browsing and detail reading side by side, and it currently renders card-based results that will become harder to scan as the archive grows.
- `resources/js/Pages/Doctor/MedicalRecords.jsx` mixes archive browsing, detail reading, and progress-entry editing on a single page.
- `resources/js/Pages/Patient/Packages.jsx` explains the package-credit flow at length, but the hierarchy competes with the actual decision and checkout tasks.
- `resources/js/Pages/Doctor/Dashboard.jsx` combines schedule, availability, consultation completion, active program review, and trend visuals into one long page.

The request is specifically about patient and doctor operational UX, so this proposal scopes the information-architecture changes to those role workspaces and does not extend the same pattern into admin pages.

## Goals / Non-Goals
- Goals:
- Make patient and doctor navigation easier to understand from the first screen.
- Separate index/list pages from detail/data-entry pages where those responsibilities are currently mixed.
- Make medical-record browsing efficient for larger result sets.
- Turn the doctor dashboard into a concise overview that points into focused workspaces.
- Simplify the patient package page around the real patient tasks: understand credit, compare packages, continue checkout.
- Non-Goals:
- Do not introduce new clinical data models or a new `medical_records` table.
- Do not redesign admin information architecture.
- Do not change package eligibility, payment, booking, or authorization business rules.

## Decisions
- Decision: Adopt an overview -> index -> detail pattern for patient and doctor operational workspaces.
- Why: The current screens mix discovery and execution. Keeping overview pages short and moving deep reading or editing into dedicated detail screens reduces confusion and makes navigation more predictable.
- Alternatives considered: Keep single-page master-detail layouts and tune spacing. Rejected because it would not address the doctor dashboard length issue and still leaves medical-record editing crowded into archive pages.

- Decision: Keep medical-record data derived from existing consultation and check-in records, but add stable typed routes or identifiers for dedicated detail pages.
- Why: The existing controllers already normalize consultation and progress records from current data sources. Reusing that model keeps scope focused while still enabling deep links and separate detail pages.
- Alternatives considered: Create a unified persisted medical-record entity. Rejected because it adds schema, migration, and sync complexity that is not required for this UX change.

- Decision: Make `/patient/medical-records` and `/doctor/medical-records` scanning-first pages, with the index optimized for tables or dense lists and the detail view optimized for reading or editing one record.
- Why: The user request explicitly calls out large data volumes and focused workflows. This structure also aligns with the current controller payload shapes, which already expose row-friendly summary fields and deeper note or attachment content.

- Decision: Shorten the doctor dashboard by moving heavy execution flows behind focused drill-in entry points.
- Why: Inline consultation completion forms and large active-program cards currently make the dashboard too long to function as an overview. The dashboard should summarize work and route the doctor into the correct focused surface.
- Alternatives considered: Keep all forms on the dashboard and rely on accordions or tabs. Rejected because the page would still serve too many purposes and remain harder to navigate on mobile.

- Decision: Simplify the patient package page into a concise decision-first catalog with current checkout shown as supporting context.
- Why: The current page repeats explanation in several sections. Patients primarily need to know whether their credit is usable, what each package costs after credit, and how to continue or start checkout.

## Risks / Trade-offs
- More routes and page transitions will require careful back-navigation and preserved filters. Mitigation: include explicit return paths and preserve filter state in query parameters where appropriate.
- The proposal depends on the still-unarchived `add-patient-medical-records` change for the base patient archive capability. Mitigation: implement this work either after that change is archived or by folding the route and UX changes into the same release branch.
- Moving doctor actions off the dashboard can add one extra click. Mitigation: keep high-signal summary cards and direct action links from overview lists so the path remains fast.

## Migration Plan
1. Introduce the new navigation and route structure for patient and doctor workspaces.
2. Split medical-record index and detail responsibilities while preserving existing derived-record authorization and asset-access patterns.
3. Replace the current long doctor dashboard sections with overview summaries and focused drill-in destinations.
4. Simplify the package page hierarchy without changing checkout semantics.
5. Update feature coverage for new routes, navigation flows, and preserved business rules.

## Open Questions
- This proposal assumes "across the platform" refers to the patient and doctor operational surfaces named in the request, not admin pages.
- This proposal assumes the doctor dashboard may introduce additional focused destinations for consultation completion or review work, because shortening the dashboard materially requires some workflow separation.
