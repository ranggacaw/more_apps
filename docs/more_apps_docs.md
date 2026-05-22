# MORÉ Aesthetic and Wellness Centre

## Website Development - Technical Documentation

> **Purpose:** implementation-aligned technical overview of the current clinic app  
> **Source of truth:** `routes/*.php`, `app/Http/Controllers/*.php`, `app/Services/*.php`, `database/migrations/*.php`, `resources/js/Pages/**/*`

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Authentication and Verification](#2-authentication-and-verification)
3. [Operational Flows](#3-operational-flows)
4. [Scheduling and Slot Lifecycle](#4-scheduling-and-slot-lifecycle)
5. [Payment and Credit Lifecycle](#5-payment-and-credit-lifecycle)
6. [Dashboards and Operational Modules](#6-dashboards-and-operational-modules)
7. [Database Schema](#7-database-schema)
8. [Routes and Controllers](#8-routes-and-controllers)
9. [Integrations and Runtime Configuration](#9-integrations-and-runtime-configuration)
10. [Folder Structure](#10-folder-structure)

---

## 1. Tech Stack

| Layer | Current implementation | Notes |
| --- | --- | --- |
| Backend | PHP 8.2 + Laravel 12 | MVC app with queues, scheduler, Eloquent, and Inertia responses |
| Frontend | Inertia.js + React 18 + Vite 7 | Server-driven SPA without a separate public REST API |
| UI | Tailwind CSS + local React components | App uses local components in `resources/js/Components` and role-specific layouts |
| Database | PostgreSQL | `.env.example` defaults `DB_CONNECTION=pgsql` |
| Auth | Laravel session auth | Login, registration, password reset, and verified middleware are all web-session based |
| Verification | WhatsApp OTP for patients, email verification for non-patients | Patients verify through `/verify-otp`; other roles use Laravel email verification links |
| Payments | Midtrans Snap | Consultation and funded package checkouts use server-created Snap tokens |
| Queue | Database queue | `config/queue.php` defaults `QUEUE_CONNECTION=database` |
| Scheduler | Laravel scheduler | Releases slot locks and queues booking/program reminders |
| Storage | Laravel Storage | Clinic assets use `CLINIC_ASSET_DISK` via `ClinicAssetService` |
| Notifications | WhatsApp + email services | Delivery is environment-driven and queued through jobs |
| Meeting links | `MeetingLinkService` | Default joinable links are Jitsi rooms; non-Jitsi providers currently fall back to Jitsi |

### Important implementation notes

- `laravel/sanctum` is installed, but the clinic flows in this app use Laravel web/session authentication rather than token-based API auth.
- Doctor profiles store a `consultation_fee`, but consultation checkout uses the fixed clinic fee from `config('clinic.consultation_fee')`.
- If Midtrans keys are missing, `MidtransService` returns demo tokens and the local app can drive status changes through `POST /payments/{payment}/simulate`.

---

## 2. Authentication and Verification

### Roles

- Roles are stored on `users.role`.
- Active application roles are `patient`, `doctor`, and `admin`.
- `/dashboard` redirects verified users to their role-specific dashboard through `DashboardRedirectController`.

### Registration and login

1. Public patient registration is handled by `POST /register` in `RegisteredUserController`.
2. Registration creates a `users` row with `role = patient`.
3. The user is logged in immediately after registration.
4. `PatientOtpService` issues a 6-digit OTP and stores its hash on the user record.
5. `SendPatientOtpJob` queues WhatsApp delivery.
6. The patient is redirected to `GET /verify-otp`.

### Verification behavior

- Patients verify by posting the 6-digit code to `POST /verify-otp`.
- A successful patient verification sets `email_verified_at`, clears the OTP fields, and redirects to `/dashboard?verified=1`.
- `POST /verification-notification` reissues a patient OTP or re-sends a staff email verification link depending on role.
- `AuthenticatedSessionController` redirects any unverified user to `route('verification.notice')` after login.
- Operational routes require both `auth` and `verified` middleware.

### OTP runtime details

- OTP values are hashed before storage in `users.verification_otp`.
- OTP expiry is 10 minutes (`PatientOtpService::EXPIRATION_MINUTES`).
- In `local` and `testing`, if WhatsApp delivery is configured to log, the verification page can expose the debug OTP instead of sending a real WhatsApp message.

---

## 3. Operational Flows

### 3.1 Public home page

- `GET /` renders `resources/js/Pages/Welcome.jsx`.
- The page shows up to 3 active doctors from `doctors`.
- The page also shows up to 3 published educational content items from `educational_contents`.

### 3.2 Patient journey

1. Register or log in.
2. Complete WhatsApp OTP verification at `/verify-otp`.
3. Open `GET /book-consultation`.
4. Read active doctors from `GET /api/doctors`.
5. Read reservable slots from `GET /api/slots?doctor_id=...&date=...`.
6. Lock a slot with `POST /slots/lock`.
7. Create the booking with `POST /bookings`.
8. Upload optional intake documents through `POST /bookings/{booking}/uploads`.
9. Continue consultation checkout on `GET /checkout/consultation/{booking}`.
10. Pay through Midtrans or demo checkout.
11. After a paid consultation is completed by the doctor, open `GET /patient/packages` to use the awarded consultation credit.
12. Submit weekly progress with `POST /patient/user-packages/{userPackage}/check-ins` for active packages.
13. Review completed consultations and weekly progress history at `GET /patient/medical-records`.

### 3.3 Doctor journey

1. Sign in to `GET /doctor/dashboard`.
2. Review upcoming confirmed bookings assigned to that doctor.
3. Manage recurring availability through `GET/POST/DELETE /doctor/availability`.
4. Complete only that doctor's confirmed bookings through `POST /doctor/bookings/{booking}/complete`.
5. Completion writes consultation notes, optional recommended package, optional meal-plan PDF, then sets the booking to `completed`.
6. Review patient package progress and store doctor feedback through `POST /doctor/check-ins/{checkIn}/review`.
7. Access combined patient consultation and progress history at `GET /doctor/medical-records`.

### 3.4 Admin journey

1. Sign in to `GET /admin/dashboard`.
2. Manage packages through `GET/POST/PATCH /admin/packages`.
3. View revenue and conversion metrics through `GET /admin/reports`.
4. Queue WhatsApp broadcasts through `GET/POST /admin/broadcasts`.
5. Manage educational content through `GET/POST/PATCH /admin/content`.
6. Provision and update users through `GET/POST/PATCH /admin/users`.

### 3.5 Admin user provisioning details

- Admins can create `patient`, `doctor`, or `admin` accounts directly.
- Admins can mark new or existing users as verified by setting `email_verified_at`.
- Switching a doctor account to another role does not delete the doctor profile; `syncDoctorProfile()` only marks it inactive.

---

## 4. Scheduling and Slot Lifecycle

### Availability and slot generation

- Doctor availability is stored in `doctor_availabilities`.
- `POST /doctor/availability` creates one availability block for a specific day, or all seven weekdays when `day_of_week = 7` is submitted.
- After availability is created, `TimeSlotService::generateUpcomingSlots()` creates future slots for the next 21 days.
- `php artisan clinic:generate-slots {doctorId} {date}` can generate slots for a doctor and date from the console.

### Slot states

- `time_slots.status` is used with `available`, `locked`, and `booked`.
- Patients only see future slots that are `available`, expired-locked, or currently locked by the same patient.

### Lock and release flow

1. `POST /slots/lock` locks a future slot for 15 minutes.
2. The lock stores `locked_by_user_id` and `locked_until`.
3. `POST /bookings` only succeeds if the slot is still locked by the same patient.
4. `POST /slots/unlock` releases a slot when it is still locked by the same patient.
5. `Schedule::call(fn () => app(TimeSlotService::class)->releaseExpiredLocks())->everyMinute()` releases expired locks.

### Expired lock cleanup

When a lock expires, `TimeSlotService::releaseExpiredLocks()`:

- marks related pending payments as `failed`,
- marks related pending bookings as `cancelled`,
- resets the slot to `available`.

---

## 5. Payment and Credit Lifecycle

### 5.1 Consultation checkout

- Consultation checkout is shown on `GET /checkout/consultation/{booking}`.
- `POST /payments/init-consultation` prepares or reuses a pending consultation payment attempt.
- The consultation amount is always `config('clinic.consultation_fee')`, which defaults to `500000`.
- Payment rows are stored in `payments` with `type = consultation`, `attempt_number`, `midtrans_order_id`, and optional `snap_token`.

### 5.2 Midtrans webhook rules

- `POST /payment/webhook` runs without the `web` middleware and is throttled at `60` requests per minute.
- `MidtransService::validateSignature()` verifies the Midtrans signature.
- `MidtransService::matchesAmount()` verifies the callback amount.
- The webhook is authoritative for final paid/failed consultation and funded package states.

### 5.3 Consultation payment success

On successful consultation payment:

- the payment becomes `paid`,
- the booking becomes `confirmed`,
- the slot becomes `booked`,
- a joinable meeting link is ensured,
- the patient receives a consultation credit equal to the paid consultation amount,
- the credit source is linked back to the consultation payment,
- a confirmation notification job is queued.

### 5.4 Consultation completion and package eligibility

- Paying for a consultation awards the consultation credit immediately.
- Using that credit for package checkout is blocked until the source booking is `completed` and the related consultation has `completed_at`.
- `PackageService::consultationCreditState()` also rejects expired, consumed, missing, or invalid-source credits.

### 5.5 Package checkout

- Patients browse packages on `GET /patient/packages`.
- Only packages with `is_active = true` are listed.
- `POST /payments/init-package` calculates `applied_credit` and `final_amount`.
- Package payments are stored in `payments` with `type = package`.
- Pending package checkout is blocked if the user already has another incompatible pending package payment.

### 5.6 Zero-balance packages

If the consultation credit fully covers the package price:

- the package is activated immediately,
- the payment is created with `provider = internal`, `amount = 0`, and `status = paid`,
- no Midtrans session is created.

### 5.7 Package activation and credit consumption

On successful package activation:

- the user consultation credit is reset to `0`,
- `consultation_credit_consumed_at` is set,
- a `user_packages` row is created,
- the source consultation is linked to that `user_package_id`,
- an activation notification job is queued.

### 5.8 Weekly program check-ins

- Weekly progress is stored in `check_ins` rows with `program_week` populated.
- Weekly progress does **not** decrement `user_packages.consultation_credits_remaining`.
- Only `PackageService::recordCheckIn()` decrements remaining consultation credits, and that is separate from the current weekly progress route.

---

## 6. Dashboards and Operational Modules

### Patient dashboard

`GET /patient/dashboard` returns:

- booking and payment counts,
- upcoming confirmed consultation,
- active packages with current program week,
- latest doctor reviews,
- engagement prompts for due weekly check-ins and meal plans.

### Doctor dashboard

`GET /doctor/dashboard` returns:

- upcoming confirmed consultation workload,
- intake notes and uploaded patient documents,
- active patient programs linked to that doctor's completed consultations,
- weekly progress history and pending review context,
- current availability blocks.

### Admin dashboard

`GET /admin/dashboard` returns:

- patient, doctor, and admin counts,
- paid revenue,
- pending and confirmed booking counts,
- active package and active entitlement counts,
- recent bookings and payments.

### Medical records

- `GET /patient/medical-records` merges completed consultations and weekly program progress for the authenticated patient.
- `GET /doctor/medical-records` merges the same record types for the doctor's own patients.
- Attachments can include meal plan PDFs, patient intake uploads, progress photos, and supporting documents.

### Broadcasts

- Admin broadcasts are stored in `whatsapp_broadcasts`.
- Recipients are materialized into `whatsapp_broadcast_deliveries` before sending starts.
- Supported audience scopes are `verified_patients`, `patients`, `doctors`, `admins`, and `all_users`.
- `SendWhatsAppBroadcastJob` updates broadcast status to `processing`, `completed`, `completed_with_failures`, or `failed`.

### Educational content

- Admin content is stored in `educational_contents`.
- Content statuses are `draft` and `published`.
- Optional managed assets are stored through `ClinicAssetService`.
- The public home page currently surfaces only published records.

---

## 7. Database Schema

### Core identity tables

| Table | Purpose | Key columns |
| --- | --- | --- |
| `users` | All app accounts | `name`, `email`, `phone`, `role`, `email_verified_at`, OTP fields, consultation credit fields |
| `doctors` | Doctor profile for a user | `user_id`, `specialization`, `bio`, `avatar_url`, `consultation_fee`, `is_active` |

### Scheduling and booking tables

| Table | Purpose | Key columns |
| --- | --- | --- |
| `doctor_availabilities` | Recurring doctor availability windows | `doctor_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`, `is_active` |
| `time_slots` | Generated bookable slots | `doctor_id`, `availability_id`, `start_time`, `end_time`, `status`, `locked_until`, `locked_by_user_id` |
| `bookings` | Consultation booking records | `user_id`, `doctor_id`, `slot_id`, `status`, `notes`, `patient_upload_path`, `meeting_link`, reminder timestamps |

### Payments and package tables

| Table | Purpose | Key columns |
| --- | --- | --- |
| `payments` | Consultation and package payments | `user_id`, `booking_id`, `package_id`, `attempt_number`, `type`, `amount`, `consultation_credit_applied`, `provider`, `midtrans_order_id`, `status`, `paid_at`, `payload` |
| `packages` | Admin-managed offerings | `name`, `slug`, `description`, `price`, `duration_days`, `type`, `consultation_credits`, `is_active` |
| `user_packages` | Activated patient package entitlements | `user_id`, `package_id`, `payment_id`, `status`, `consultation_credits_total`, `consultation_credits_remaining`, `activated_at`, `expires_at`, `metadata` |

### Clinical record tables

| Table | Purpose | Key columns |
| --- | --- | --- |
| `consultations` | Completed consultation output | `booking_id`, `user_id`, `doctor_id`, `recommended_package_id`, `user_package_id`, `notes`, `meal_plan_pdf_path`, `completed_at` |
| `check_ins` | Reused for operational and program follow-up records | `user_package_id`, `booking_id`, `consultation_id`, `user_id`, `doctor_id`, `program_week`, `weight_kg`, `waist_cm`, `progress_photo_path`, `review_notes`, `remaining_consultations_after`, `checked_in_at`, `reviewed_at` |

### Admin operations tables

| Table | Purpose | Key columns |
| --- | --- | --- |
| `educational_contents` | Admin-authored educational content | `title`, `slug`, `excerpt`, `body`, `status`, `asset_path`, `published_at`, audit user IDs |
| `whatsapp_broadcasts` | Broadcast request headers | `requested_by_user_id`, `audience_scope`, `message`, `status`, `recipient_count`, lifecycle timestamps |
| `whatsapp_broadcast_deliveries` | Per-recipient broadcast delivery rows | `whatsapp_broadcast_id`, `user_id`, `phone`, `status`, `sent_at`, `error_message` |

### Common runtime status values

| Area | Values used in code |
| --- | --- |
| `users.role` | `patient`, `doctor`, `admin` |
| `bookings.status` | `pending`, `confirmed`, `completed`, `cancelled` |
| `payments.status` | `pending`, `paid`, `failed` |
| `payments.type` | `consultation`, `package` |
| `time_slots.status` | `available`, `locked`, `booked` |
| `user_packages.status` | `active`, `completed` |
| `educational_contents.status` | `draft`, `published` |
| `whatsapp_broadcasts.status` | `queued`, `processing`, `completed`, `completed_with_failures`, `failed` |
| `whatsapp_broadcast_deliveries.status` | `pending`, `sent`, `failed` |

---

## 8. Routes and Controllers

### Public and auth routes

| Method | Path | Controller |
| --- | --- | --- |
| `GET` | `/` | welcome closure in `routes/web.php` |
| `GET` | `/clinic-assets/{path}` | `ClinicAssetController@show` |
| `GET` | `/register` | `RegisteredUserController@create` |
| `POST` | `/register` | `RegisteredUserController@store` |
| `GET` | `/login` | `AuthenticatedSessionController@create` |
| `POST` | `/login` | `AuthenticatedSessionController@store` |
| `GET` | `/verify-otp` | `EmailVerificationPromptController` |
| `POST` | `/verify-otp` | `VerifyOtpController@store` |
| `POST` | `/verification-notification` | `EmailVerificationNotificationController@store` |
| `POST` | `/logout` | `AuthenticatedSessionController@destroy` |

### Verified shared route

| Method | Path | Controller |
| --- | --- | --- |
| `GET` | `/dashboard` | `DashboardRedirectController` |

### Patient routes

| Method | Path | Controller |
| --- | --- | --- |
| `GET` | `/patient/dashboard` | `PatientDashboardController` |
| `GET` | `/patient/medical-records` | `PatientMedicalRecordController` |
| `GET` | `/patient/packages` | `PaymentController@showPackageCatalog` |
| `POST` | `/patient/user-packages/{userPackage}/check-ins` | `PatientProgramController@storeCheckIn` |
| `GET` | `/book-consultation` | `BookingController@create` |
| `POST` | `/bookings` | `BookingController@store` |
| `POST` | `/bookings/{booking}/uploads` | `BookingController@uploadDocument` |
| `GET` | `/checkout/consultation/{booking}` | `PaymentController@showConsultationCheckout` |
| `POST` | `/payments/init-consultation` | `PaymentController@initConsultation` |
| `POST` | `/payments/init-package` | `PaymentController@initPackage` |
| `POST` | `/payments/{payment}/simulate` | `PaymentController@simulate` |
| `GET` | `/api/doctors` | `DoctorController@index` |
| `GET` | `/api/slots` | `SlotController@available` |
| `POST` | `/slots/lock` | `SlotController@lock` |
| `POST` | `/slots/unlock` | `SlotController@unlock` |

### Doctor routes

| Method | Path | Controller |
| --- | --- | --- |
| `GET` | `/doctor/dashboard` | `DoctorDashboardController` |
| `GET` | `/doctor/medical-records` | `DoctorMedicalRecordController` |
| `GET` | `/doctor/availability` | `DoctorAvailabilityController` |
| `POST` | `/doctor/availability` | `DoctorAvailabilityController@store` |
| `DELETE` | `/doctor/availability/{availability}` | `DoctorAvailabilityController@destroy` |
| `POST` | `/doctor/bookings/{booking}/complete` | `DoctorDashboardController@complete` |
| `PATCH` | `/doctor/check-ins/{checkIn}` | `DoctorProgramController@update` |
| `POST` | `/doctor/check-ins/{checkIn}/review` | `DoctorProgramController@review` |

### Admin routes

| Method | Path | Controller |
| --- | --- | --- |
| `GET` | `/admin/dashboard` | `AdminDashboardController` |
| `GET` | `/admin/packages` | `AdminPackageController@index` |
| `POST` | `/admin/packages` | `AdminPackageController@store` |
| `PATCH` | `/admin/packages/{package}` | `AdminPackageController@update` |
| `GET` | `/admin/reports` | `AdminReportController@index` |
| `GET` | `/admin/broadcasts` | `AdminBroadcastController@index` |
| `POST` | `/admin/broadcasts` | `AdminBroadcastController@store` |
| `GET` | `/admin/content` | `AdminContentController@index` |
| `POST` | `/admin/content` | `AdminContentController@store` |
| `PATCH` | `/admin/content/{content}` | `AdminContentController@update` |
| `GET` | `/admin/users` | `AdminUserController@index` |
| `POST` | `/admin/users` | `AdminUserController@store` |
| `PATCH` | `/admin/users/{user}` | `AdminUserController@update` |

### Webhook route

| Method | Path | Controller |
| --- | --- | --- |
| `POST` | `/payment/webhook` | `PaymentController@webhook` |

---

## 9. Integrations and Runtime Configuration

### Clinic config

`config/clinic.php` controls:

- `CLINIC_ASSET_DISK`
- `CLINIC_CONSULTATION_FEE`
- `CLINIC_CONSULTATION_CREDIT_EXPIRES_DAYS`
- `CLINIC_DAY_BEFORE_REMINDER_AT`
- `CLINIC_SAME_DAY_REMINDER_LEAD_MINUTES`
- `CLINIC_SAME_DAY_REMINDER_WINDOW_MINUTES`
- `CLINIC_WEEKLY_CHECK_IN_REMINDER_AT`

### Payment config

`config/midtrans.php` uses:

- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_IS_PRODUCTION`

### Notification and meeting config

`config/services.php` uses:

- `CLINIC_EMAIL_PROVIDER`
- `WHATSAPP_PROVIDER`
- `FONNTE_TOKEN`, `FONNTE_URL`
- `WABLAS_TOKEN`, `WABLAS_URL`
- `MEETING_PROVIDER`
- `GOOGLE_MEET_BASE_URL`
- `JITSI_MEETING_BASE_URL`
- `ZOOM_MEETING_BASE_URL`

### Runtime behavior

- Booking reminders are queued, not sent inline.
- Weekly check-in reminders are queued, not sent inline.
- WhatsApp broadcasts are queued, not sent inline.
- Local asset URLs are normalized through `ClinicAssetService`; signed fallback routes are used when needed.
- `.env.example` defaults to PostgreSQL, database sessions, database queue, and local storage.

---

## 10. Folder Structure

```text
app/
├── Http/
│   └── Controllers/
│       ├── Admin*.php
│       ├── Auth/*.php
│       ├── BookingController.php
│       ├── DashboardRedirectController.php
│       ├── Doctor*.php
│       ├── Patient*.php
│       ├── PaymentController.php
│       └── SlotController.php
├── Jobs/
│   ├── SendBookingNotificationJob.php
│   ├── SendPatientOtpJob.php
│   ├── SendUserPackageNotificationJob.php
│   └── SendWhatsAppBroadcastJob.php
├── Models/
│   ├── Booking.php
│   ├── CheckIn.php
│   ├── Consultation.php
│   ├── Doctor.php
│   ├── EducationalContent.php
│   ├── Package.php
│   ├── Payment.php
│   ├── TimeSlot.php
│   ├── User.php
│   ├── UserPackage.php
│   └── WhatsAppBroadcast.php
└── Services/
    ├── BookingReminderService.php
    ├── ClinicAssetService.php
    ├── EmailNotificationService.php
    ├── MeetingLinkService.php
    ├── MidtransService.php
    ├── PackageService.php
    ├── PatientOtpService.php
    ├── ProgramReminderService.php
    ├── TimeSlotService.php
    └── WhatsAppService.php

config/
├── clinic.php
├── midtrans.php
├── queue.php
└── services.php

database/
├── migrations/
└── seeders/

resources/js/
├── Components/
├── Layouts/
│   ├── AppLayout.jsx
│   ├── DoctorLayout.jsx
│   ├── GuestLayout.jsx
│   └── PatientLayout.jsx
└── Pages/
    ├── Admin/
    ├── Auth/
    ├── Doctor/
    ├── Patient/
    ├── Profile/
    └── Welcome.jsx

routes/
├── auth.php
├── console.php
└── web.php
```

### Primary page files

- `resources/js/Pages/Patient/BookConsultation.jsx`
- `resources/js/Pages/Patient/Checkout.jsx`
- `resources/js/Pages/Patient/Dashboard.jsx`
- `resources/js/Pages/Patient/MedicalRecords.jsx`
- `resources/js/Pages/Patient/Packages.jsx`
- `resources/js/Pages/Doctor/Dashboard.jsx`
- `resources/js/Pages/Doctor/Availability.jsx`
- `resources/js/Pages/Doctor/MedicalRecords.jsx`
- `resources/js/Pages/Admin/Dashboard.jsx`
- `resources/js/Pages/Admin/Packages.jsx`
- `resources/js/Pages/Admin/Reports.jsx`
- `resources/js/Pages/Admin/Broadcasts.jsx`
- `resources/js/Pages/Admin/Content.jsx`
- `resources/js/Pages/Admin/Users.jsx`

---

This document is intentionally aligned to the currently implemented codebase and should be updated whenever routes, lifecycle states, migrations, or operational modules change.
