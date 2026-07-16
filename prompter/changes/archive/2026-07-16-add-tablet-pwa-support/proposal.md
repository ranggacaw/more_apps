# Change: Add Tablet PWA Support

## Why
The clinic app will be accessed from tablets, so staff and patients need an installable app-like experience with tablet-friendly workspaces. The current Laravel/Inertia app has responsive layouts but no Web App Manifest, service worker, offline fallback, or tablet-specific standalone PWA support.

## What Changes
- Add PWA installability metadata, manifest, icons, and app shell tags for tablet browsers.
- Add a conservative service worker that caches static assets and shows a branded offline fallback for navigation failures.
- Keep clinical, queue, booking, payment, finance, JSON/API, and mutation traffic network-only to avoid stale or unsafe offline actions.
- Polish shared admin, doctor, and patient layouts for tablet and installed standalone display.
- Improve key tablet workflows across admin queue/bookings/tables, doctor consultation workspace, and patient dashboard.
- Add feature coverage for PWA assets and app shell metadata.

## Impact
- Affected specs: `clinic-tablet-pwa`
- Affected code: `resources/views/app.blade.php`, `resources/js/app.jsx`, `resources/css/app.css`, `public/manifest.webmanifest`, `public/service-worker.js`, `public/offline.html`, `public/icons/*`, role layouts under `resources/js/Layouts`, selected tablet-heavy pages under `resources/js/Pages`, `resources/js/Components/AdminDataTable.jsx`, and `tests/Feature/PwaAssetsTest.php`
- No database schema changes
