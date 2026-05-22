# Change: Align clinic technical documentation with the implemented app

## Why
`docs/more_apps_docs.md` no longer matches the current Laravel application closely enough to be trusted as a technical reference. It still describes outdated stack versions, route paths, schema examples, and operational flows that differ from the implemented patient, doctor, and admin experience.

## What Changes
- Update `docs/more_apps_docs.md` so its stack, authentication, verification, routing, payment, scheduling, dashboard, schema, and folder structure sections reflect the current implementation.
- Document implemented operational modules that are currently missing or understated, including patient and doctor medical records, weekly program check-ins, admin broadcasts, admin content management, and admin user provisioning.
- Clarify real runtime behavior for consultation credits, zero-balance package activation, dashboard redirection, meeting link generation, and background reminders.

## Impact
- Affected specs: `clinic-technical-documentation`
- Affected code: `docs/more_apps_docs.md`
- Reference sources: `routes/web.php`, `routes/console.php`, `routes/auth.php`, `app/Http/Controllers/*.php`, `app/Services/*.php`, `database/migrations/*.php`, `resources/js/Pages/**/*`, `resources/js/Layouts/**/*`
