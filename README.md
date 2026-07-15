# MORE Clinic

A clinic operations platform for **MORE Clinic**, built with Laravel 12, Inertia.js, and React. It covers doctor consultations, patient programs, finance reporting, admin back-office tooling, WhatsApp broadcasts, and an installable tablet PWA — all on top of PostgreSQL.

## Tech Stack

| Layer        | Technology                                                                 |
| ------------ | ------------------------------------------------------------------------- |
| Backend      | Laravel 12 (PHP 8.2+), Sanctum, Eloquent, Database queues                  |
| Frontend     | Inertia.js + React 18, Tailwind CSS, Vite, Headless UI, TanStack Table     |
| Database     | PostgreSQL 17                                                              |
| Payments     | Midtrans (consultations & funded packages)                                 |
| Messaging    | Environment-driven WhatsApp (Fonnte/Wablas) and email providers            |
| Meetings     | Google Meet / Jitsi / Zoom (doctor-supplied for online consultations)      |
| Deployment   | Docker + Docker Compose, Nginx                                             |

## Features

- **Role-based portals** — `doctor`, `admin`, `super_admin`, and `patient` accounts with role-specific dashboards
- **Consultation workflow** — fixed Rp 500.000 checkout via Midtrans; admin-assisted bookings (registered or guest) with online/offline modes; queue management for same-day offline visits
- **Clinic queue** — per-day numeric sequencing for walk-ins and bookings, doctor call/start/complete flow, no-show handling
- **Patient programs** — consultation-credit based packages, weekly progress check-ins with doctor follow-up, slimming monitoring forms
- **Doctor catalog** — package create/update/deactivate with historical preservation, treatment line items, Aesthetic Programs, Diamond add-ons
- **Finance** — cash-basis profit & loss from paid payments, operating expenses, balance-sheet entries; read-only for doctors, full control for super admins
- **Admin back-office** — users, broadcasts, educational content, invoices, bookings, reports via shared `AdminDataTable`
- **WhatsApp broadcasts** — queued delivery to `doctors`, `admins`, or `all_users` audiences
- **Tablet PWA** — installable standalone app shell with versioned service worker and offline fallback

## Project Structure

```
app/                 # Laravel backend (HTTP, models, services, actions)
  Http/Controllers/  # Admin, Doctor, Finance, Patient, Auth controllers
resources/js/        # React frontend (Pages, Components, Layouts)
routes/              # web.php, auth.php, console.php
database/            # migrations, factories, seeders
deploy/vps/          # provisioning, deploy, and backup scripts
public/              # PWA manifest, service worker, offline page, icons
tests/               # PHPUnit feature tests
```

## Requirements

- PHP 8.2+
- Composer
- Node.js & npm
- PostgreSQL 17
- Docker & Docker Compose (for containerized setup)

## Local Development

### Option A — Docker (recommended)

```bash
cp .env.example .env
docker compose up -d --build
```

The stack brings up four services plus Nginx and Postgres: `app`, `queue`, `scheduler`, and `pgsql`. The app is served at `http://localhost:8080`.

Inside the container, run migrations and seeders:

```bash
docker compose exec app php artisan migrate --seed
```

### Option B — Native (e.g. Laragon)

```bash
composer install
npm install
npm run build
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

Run the full dev environment (server, queue, logs, Vite) in one command:

```bash
composer dev
```

> The `scheduler` and `queue` workers must be running for slot releases, reminders, and broadcast delivery to fire.

## Configuration

Key environment variables (see `.env.example` for the full list):

| Variable                              | Purpose                                                        |
| ------------------------------------- | ------------------------------------------------------------- |
| `DB_*`                                | PostgreSQL connection                                          |
| `MIDTRANS_CLIENT_KEY` / `_SERVER_KEY` | Payment gateway credentials                                    |
| `MIDTRANS_IS_PRODUCTION`              | Toggle sandbox vs production                                   |
| `WHATSAPP_PROVIDER`                   | `log`, `fonnte`, or `wablas`                                   |
| `FONNTE_TOKEN` / `WABLAS_TOKEN`       | WhatsApp API tokens                                            |
| `MEETING_PROVIDER`                    | `jitsi`, `google`, or `zoom`                                   |
| `CLINIC_ASSET_DISK`                   | Disk for clinic-managed assets                                 |
| `CLINIC_EMAIL_PROVIDER`               | Email backend for notifications                                |
| `CLINIC_*_REMINDER_*`                 | Appointment and weekly check-in reminder scheduling           |

The consultation fee is configured via the `clinic.consultation_fee` config value (fixed Rp 500.000).

## Roles & Access

- **`doctor`** — consultations, program reviews, medical records, package catalog, finance (read-only)
- **`admin`** — back-office modules, bookings, broadcasts, content, users, queue (excluded from `/finance`)
- **`super_admin`** — everything admins can do plus finance mutations
- **`patient`** — read-only portal access for package progress, reports, and records

Operational accounts must be **verified** before accessing dashboards or workflows. Authenticated doctor accounts changing roles keep their doctor profile (marked inactive).

## Testing

```bash
composer test        # clears config and runs the test suite
# or directly:
php artisan test
```

Code style is enforced with Laravel Pint:

```bash
./vendor/bin/pint
```

## PWA

The app is installable on iPadOS/Android tablets. The manifest, service worker, and offline page are served by named routes so MIME types and scope stay correct regardless of static-file handling. The service worker registers only in production or when `VITE_ENABLE_PWA=true`. Navigations are network-first with a branded offline fallback; queue, booking, payment, and clinical state always bypass the cache.

## Deployment

Production deployment scripts live in `deploy/vps/`:

```bash
# 1. Provision the server (Docker, Certbot, app dirs)
deploy/vps/provision.sh

# 2. Build and start the production stack
docker compose -f docker-compose.prod.yml up -d --build

# 3. Ongoing releases
deploy/vps/deploy.sh

# 4. Scheduled PostgreSQL backups
deploy/vps/backup.sh
```

See `deploy/vps/README.md` for SSL, backup, and post-deploy verification details.

## Domain Notes

A condensed summary of the operational rules lives in `AGENTS.md` (e.g. cash-basis P&L, webhook-authoritative package purchases, queue sequencing, schedule override auditing). Consult it for the authoritative spec before making non-trivial changes.
