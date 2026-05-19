# Change: Add MORE Clinic Platform MVP

## Why
MORE Aesthetic and Wellness Centre needs a single clinic platform for patient booking, doctor operations, and admin management. The project already has a technical concept in `docs/more_apps_docs.md`, but it does not yet have an approved Prompter proposal that captures the verified MVP scope, stack, and deployment decisions.

## What Changes
- Add a responsive web MVP for patients, doctors, and admins.
- Standardize the application stack on Laravel 12, Inertia.js with React, PostgreSQL, and Docker.
- Define the core workflows for authentication, doctor availability, booking, payments, notifications, and role-based dashboards.
- Defer native mobile apps, real-time features, full-text search, and advanced analytics until after MVP.
- Target deployment to a VPS with separate development and production environments.

## Impact
- Affected specs: `clinic-mvp`
- Affected code: Laravel application bootstrap, authentication, scheduling, bookings, payments, notifications, dashboards, Docker, and VPS deployment configuration
