# Design: Tablet PWA Support

## Context
The app is a Laravel 12 backend with an Inertia.js React frontend built by Vite. The shared HTML shell is `resources/views/app.blade.php`, the React entrypoint is `resources/js/app.jsx`, and role workspaces use shared layouts under `resources/js/Layouts`. The app supports clinical, queue, finance, booking, and payment workflows that depend on current server-side state.

## Goals / Non-Goals
- Goal: Make the app installable from tablet browsers with MORÉ branding and a standalone display mode.
- Goal: Provide a safe offline fallback for lost connectivity without implying clinical workflows can continue offline.
- Goal: Improve tablet usability across admin, doctor, and patient portals using existing layout patterns.
- Non-goal: Add push notifications.
- Non-goal: Add background sync or offline form submission.
- Non-goal: Replace the existing visual design system.

## Decisions
- Decision: Use a static service worker in `public/service-worker.js` instead of adding `vite-plugin-pwa` initially.
- Rationale: The existing Vite setup is simple and a static service worker is enough for installability, static asset caching, and navigation fallback.
- Alternative considered: Add Workbox through `vite-plugin-pwa`.
- Why deferred: It introduces a new build dependency and broader generated-service-worker behavior that is not required for the first tablet PWA pass.

- Decision: Cache only static assets and navigation fallback content; keep JSON/API, signed assets, payments, and all non-GET requests network-only.
- Rationale: Queue, booking, consultation, finance, auth, and payment state must stay server-authoritative.
- Alternative considered: Offline-first caching for authenticated Inertia pages.
- Why rejected: Stale clinical or operational data could cause unsafe decisions or duplicate workflow actions.

- Decision: Use `/dashboard` as the manifest `start_url`.
- Rationale: Existing routing redirects users to the correct role workspace after auth and keeps one PWA entrypoint for all portal roles.

- Decision: Apply tablet polish to shared role layouts plus a small set of high-use tablet pages.
- Rationale: Shared layout changes deliver broad benefit, while queue, booking, clinical entry, patient dashboard, and admin tables are the most touch-heavy surfaces observed in the current codebase.

## Risks / Trade-offs
- Risk: Service worker caches stale authenticated content.
- Mitigation: Do not cache JSON/API responses, signed clinic assets, or non-GET requests; use network-first navigations with offline fallback.

- Risk: Users expect offline form submissions to work.
- Mitigation: Offline page copy must clearly state that network is required for clinic actions.

- Risk: iPadOS and Android tablet install criteria differ.
- Mitigation: Include both Web App Manifest metadata and Apple mobile web app/touch icon tags.

- Risk: Tablet layout changes affect desktop workflows.
- Mitigation: Keep changes scoped to responsive breakpoints, safe-area spacing, and touch targets; validate desktop build.

## Migration Plan
No data migration is required. Deploying the change adds public static assets and app shell metadata. Existing browser sessions continue to work; users can install the PWA after reloading the app. The service worker should use a versioned cache and delete older caches on activation.

## Open Questions
- Exact production icon artwork can be replaced later if a final brand asset is provided.
