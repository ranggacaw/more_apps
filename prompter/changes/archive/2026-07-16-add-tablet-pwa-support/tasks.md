## 1. PWA App Shell And Assets
- [x] 1.1 Create `public/manifest.webmanifest` with `name`, `short_name`, `start_url: /dashboard`, `scope: /`, `display: standalone`, `theme_color`, `background_color`, and tablet-appropriate icons.
- [x] 1.2 Add PWA icon assets under `public/icons/`, including 192px, 512px, maskable, and Apple touch variants.
- [x] 1.3 Update `resources/views/app.blade.php` with manifest link, theme color, Apple mobile web app tags, icon links, viewport fit support, and app title metadata.
- [x] 1.4 Add branded `public/offline.html` with a reconnect/retry flow and no authenticated data.

## 2. Service Worker Runtime
- [x] 2.1 Create `public/service-worker.js` with versioned caches for app shell, manifest, icons, offline page, and built Vite assets.
- [x] 2.2 Make the service worker network-only for non-GET requests, JSON/API polling, signed clinic assets, payment paths, and authenticated mutations.
- [x] 2.3 Use static-asset caching only for `/build/*`, icons, CSS, JS, fonts, the manifest, and the offline fallback.
- [x] 2.4 Use network-first navigation handling with `public/offline.html` as fallback when tablet network is unavailable.
- [x] 2.5 Register the service worker in `resources/js/app.jsx` behind `serviceWorker in navigator` and production-safe conditions.

## 3. Tablet And Standalone UI Polish
- [x] 3.1 Add safe-area and standalone display utilities in `resources/css/app.css` for installed tablet browser chrome differences.
- [x] 3.2 Update `resources/js/Layouts/AdminLayout.jsx` for tablet navigation, touch-friendly targets, standalone spacing, and landscape content width.
- [x] 3.3 Update `resources/js/Layouts/DoctorLayout.jsx` for tablet navigation, touch-friendly targets, standalone spacing, and consultation workspace shell behavior.
- [x] 3.4 Update `resources/js/Layouts/PatientLayout.jsx` for patient tablet navigation and standalone portal spacing.
- [x] 3.5 Update `resources/js/Components/AdminDataTable.jsx` to wrap pagination controls and preserve horizontal table usability on tablets.
- [x] 3.6 Tune `resources/js/Pages/Admin/Queue.jsx` for tablet queue operation with larger action areas and stable two-column behavior where width allows.
- [x] 3.7 Tune `resources/js/Pages/Admin/Bookings.jsx` for tablet assisted booking with better summary placement and slot tap targets.
- [x] 3.8 Tune `resources/js/Pages/Doctor/ConsultationWorkspace.jsx` for tablet clinical entry with readable two-pane layout and touch-friendly inputs.
- [x] 3.9 Tune `resources/js/Pages/Patient/Dashboard.jsx` for tablet card and metric layout consistency.

## 4. Tests And Validation
- [x] 4.1 Add `tests/Feature/PwaAssetsTest.php` asserting `/manifest.webmanifest`, `/service-worker.js`, and `/offline.html` return successful responses with expected content.
- [x] 4.2 Add a test assertion that the root app shell includes the manifest link and mobile app metadata.
- [x] 4.3 Run `npm run build` to verify Vite output and service-worker registration compile cleanly.
- [x] 4.4 Run `php artisan test --filter=PwaAssetsTest`.
- [ ] 4.5 Manually verify install behavior with browser devtools/Lighthouse or an actual tablet browser.

## Post-Implementation
- [x] Update `AGENTS.md` in the project root with the new PWA/tablet runtime behavior.
