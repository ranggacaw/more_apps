# MORÉ Aesthetic and Wellness Centre

## Website Development — Technical Documentation

> **Stack:** Laravel · Inertia.js · React · PostgreSQL · Shadcn/ui  
> **Version:** 1.0 | Confidential

-----

## Table of Contents

1. [Tech Stack](#1-tech-stack)
1. [User Journey Flow](#2-user-journey-flow)
1. [Payment Flow — Midtrans](#3-payment-flow--midtrans)
1. [Scheduling System](#4-scheduling-system)
1. [Deduction Logic — Kredit Konsultasi](#5-deduction-logic--kredit-konsultasi)
1. [Dashboard Breakdown](#6-dashboard-breakdown)
1. [Database Schema](#7-database-schema)
1. [Routes & Controller](#8-routes--controller)
1. [Folder Structure](#9-folder-structure)

-----

## 1. Tech Stack

|Layer            |Teknologi                              |Keterangan                                                                                  |
|-----------------|---------------------------------------|--------------------------------------------------------------------------------------------|
|**Backend**      |Laravel 11                             |REST API + Server-side logic. Artisan, Eloquent ORM, Queue, Scheduler                       |
|**Frontend**     |Inertia.js + React 18                  |SPA tanpa API terpisah. Inertia menghubungkan Laravel controller langsung ke React component|
|**UI Components**|Shadcn/ui + Tailwind CSS               |Component library premium, fully customizable, dark mode ready                              |
|**Database**     |PostgreSQL                             |Relational DB. Kuat untuk relasi pasien-booking-payment                                     |
|**Auth**         |Laravel Sanctum + OTP                  |Session-based auth. OTP via WA/Email untuk verifikasi register                              |
|**Payment**      |Midtrans Snap API                      |Pop-up payment. Support semua metode lokal Indonesia                                        |
|**Notifikasi WA**|Fonnte / Wablas API                    |Kirim WA otomatis: OTP, konfirmasi, reminder                                                |
|**Email**        |Laravel Mailer + Mailtrap/Mailgun      |Email konfirmasi & reminder                                                                 |
|**Meeting Link** |Zoom API / Google Meet                 |Auto-generate link meeting setelah payment confirmed                                        |
|**Storage**      |Laravel Storage + S3 / local           |Upload foto pasien, PDF meal plan, dokumen lab                                              |
|**Queue**        |Laravel Queue (Redis / Database driver)|Async jobs: kirim WA, email, generate PDF                                                   |
|**Scheduler**    |Laravel Task Scheduler                 |Cron: reminder H-1 & H-3jam, release locked slot                                            |
|**Hosting**      |VPS / Laravel Forge + Nginx            |Backend + frontend dalam satu Laravel app                                                   |

### Catatan Stack

```
Laravel (MVC)
    ↓  Inertia.js  ↓
React Component (Shadcn/ui)
    ↕
PostgreSQL (via Eloquent ORM)
    ↕
External: Midtrans · Fonnte · Zoom · S3
```

> **Kenapa Inertia?**  
> Tidak perlu buat REST API terpisah. Controller Laravel langsung return React page via `Inertia::render('PageName', $data)`. Lebih simpel, lebih cepat develop, auth tetap pakai Laravel session.

-----

## 2. User Journey Flow

### 2.1 Register & Login

```
Pasien buka website
    → GET /register → Inertia render Register.jsx (Shadcn Form)
    → Input: nama, email, no HP, password
    → POST /register → RegisterController
        → Validasi data
        → Hash password (bcrypt)
        → INSERT users (verified = false)
        → Kirim OTP via WA (dispatch SendOtpJob)
    → Redirect → /verify-otp
    → Input OTP
    → POST /verify-otp → OtpController
        → Cek OTP valid & belum expired
        → UPDATE users SET verified = true
        → Login otomatis → redirect /dashboard
```

### 2.2 Booking Konsultasi

```
Pasien → /book-consultation
    → GET /doctors → DoctorController@index
        → Return list dokter aktif + foto + bio
    → Pilih dokter → GET /slots?doctor_id=&date=
        → SlotController@available
        → Return slot dengan status = AVAILABLE
    → Pilih slot → POST /slots/lock
        → Validasi slot masih AVAILABLE
        → UPDATE time_slots SET status = LOCKED, locked_by = user_id, locked_until = now + 15 menit
        → Return slot_id ke frontend
    → Konfirmasi booking → POST /booking/create
        → INSERT bookings (status = PENDING)
        → Redirect ke /checkout/consultation/{booking_id}
```

### 2.3 Payment & Konfirmasi

```
Checkout page → POST /payment/init-consultation
    → Buat / reuse pending payment attempt dengan amount tetap = 500000
    → Simpan order_id Midtrans unik per attempt ke tabel payments
    → Return booking summary + payment metadata + snap_token ke frontend

Frontend → window.snap.pay(snap_token)
    → User bayar
    → Callback browser hanya refresh / navigate UI checkout
    → Midtrans kirim webhook POST /payment/webhook

WebhookController
    → Verifikasi signature (SHA-512)
    → Verifikasi gross_amount sama dengan payment amount tersimpan
    → Jika SETTLEMENT:
        ✓ UPDATE payments SET status = PAID
        ✓ UPDATE bookings SET status = CONFIRMED
        ✓ UPDATE time_slots SET status = BOOKED
        ✓ Generate meeting link (Zoom/Meet API)
        ✓ Dispatch queue: konfirmasi WA + email dengan detail meeting access
    → Jika PENDING:
        ✓ Simpan payload callback tanpa mengubah booking / slot
    → Jika DENY / CANCEL / EXPIRE / FAILURE:
        ✗ UPDATE payments SET status = FAILED
        ✗ UPDATE bookings SET status = CANCELLED
        ✗ UPDATE time_slots SET status = AVAILABLE (release slot)
    → Duplicate callback tidak boleh mengulang side effect final
```

### 2.4 Pasca Konsultasi → Pilih Paket

```
Dokter mark konsultasi selesai
    → Buka `/doctor/dashboard`
    → Review booking confirmed milik dokter itu sendiri, termasuk `bookings.notes` dan dokumen upload pasien bila ada
    → POST /doctor/bookings/{booking}/complete
    → UPSERT `consultations` (notes, recommended_package_id, completed_at)
    → UPDATE bookings SET status = COMPLETED setelah data konsultasi tersimpan
    → Dispatch queue WA + email ke pasien: "Konsultasi selesai, lanjut pilih paket"

Pasien → /packages
    → GET /packages/with-credit?user_id=
        → Return daftar paket + harga setelah deduct consultation_credit
    → Pilih paket → POST /payment/init-package
        → Validasi: consultation_credit > 0 & booking status = DONE
        → final_price = package_price - consultation_credit
        → Buat Midtrans transaction (amount = final_price)
    → Bayar → Webhook SETTLEMENT
        ✓ UPDATE users SET consultation_credit = 0
        ✓ INSERT user_packages (status = ACTIVE)
        ✓ Dispatch: SendPackageActiveWaJob
```

-----

## 3. Payment Flow — Midtrans

### 3.1 Inisialisasi Transaksi (Server-Side)

```php
// PaymentController.php

public function initConsultation(Request $request)
{
    $booking = Booking::findOrFail($request->booking_id);

    \Midtrans\Config::$serverKey = config('midtrans.server_key');
    \Midtrans\Config::$isProduction = config('midtrans.is_production');
    \Midtrans\Config::$isSanitized = true;
    \Midtrans\Config::$is3ds = true;

    $orderId = 'KONSUL-' . $booking->id . '-' . time();

    $params = [
        'transaction_details' => [
            'order_id'     => $orderId,
            'gross_amount' => 500000,
        ],
        'customer_details' => [
            'first_name' => auth()->user()->name,
            'email'      => auth()->user()->email,
            'phone'      => auth()->user()->phone,
        ],
        'item_details' => [[
            'id'       => 'KONSUL-FEE',
            'price'    => 500000,
            'quantity' => 1,
            'name'     => 'Biaya Konsultasi MORÉ',
        ]],
    ];

    $snapToken = \Midtrans\Snap::getSnapToken($params);

    Payment::create([
        'user_id'          => auth()->id(),
        'booking_id'       => $booking->id,
        'amount'           => 500000,
        'type'             => 'consultation',
        'midtrans_order_id'=> $orderId,
        'midtrans_status'  => 'PENDING',
    ]);

    return response()->json(['snap_token' => $snapToken]);
}
```

### 3.2 Frontend — Trigger Snap

```jsx
// resources/js/Pages/Checkout.jsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Checkout({ booking, snapToken }) {
    const [loading, setLoading] = useState(false);

    const handlePay = () => {
        setLoading(true);
        window.snap.pay(snapToken, {
            onSuccess: (result) => {
                // Midtrans webhook tetap jadi sumber kebenaran
                window.location.href = '/checkout/consultation/' + booking.id;
            },
            onPending: (result) => {
                window.location.href = '/checkout/consultation/' + booking.id;
            },
            onError: (result) => {
                window.location.href = '/checkout/consultation/' + booking.id;
            },
            onClose: () => {
                window.location.href = '/checkout/consultation/' + booking.id;
            }
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
                Biaya konsultasi akan dipotong dari harga paket pilihan kamu.
            </p>
            <Button onClick={handlePay} disabled={loading} className="bg-[#B5922A]">
                {loading ? 'Memproses...' : 'Bayar Rp 500.000'}
            </Button>
        </div>
    );
}
```

### 3.3 Webhook Handler

```php
// PaymentController.php

public function webhook(Request $request)
{
    \Midtrans\Config::$serverKey = config('midtrans.server_key');
    \Midtrans\Config::$isProduction = config('midtrans.is_production');

    $notif = new \Midtrans\Notification();

    // Verifikasi signature
    $signatureKey = hash('sha512',
        $notif->order_id .
        $notif->status_code .
        $notif->gross_amount .
        config('midtrans.server_key')
    );

    if ($signatureKey !== $notif->signature_key) {
        return response()->json(['message' => 'Invalid signature'], 403);
    }

    $payment = Payment::where('midtrans_order_id', $notif->order_id)->firstOrFail();

    match ($notif->transaction_status) {
        'settlement', 'capture' => $this->handleSuccess($payment, $notif),
        'pending'               => $payment->update(['midtrans_status' => 'PENDING']),
        'deny', 'cancel', 'expire' => $this->handleFailed($payment),
        default                 => null,
    };

    return response()->json(['message' => 'OK']);
}

private function handleSuccess(Payment $payment, $notif): void
{
    DB::transaction(function () use ($payment, $notif) {
        $payment->update(['midtrans_status' => 'PAID']);

        if ($payment->type === 'consultation') {
            $booking = $payment->booking;
            $booking->update(['status' => 'CONFIRMED']);
            $booking->slot->update(['status' => 'BOOKED']);

            // Generate meeting link
            $meetingLink = app(ZoomService::class)->createMeeting($booking);
            $booking->update(['meeting_link' => $meetingLink]);

            // Kirim notif
            dispatch(new SendConfirmationWaJob($booking));
            dispatch(new SendConfirmationEmailJob($booking));

        } elseif ($payment->type === 'package') {
            $user = $payment->user;
            $user->update(['consultation_credit' => 0]);

            UserPackage::create([
                'user_id'    => $user->id,
                'package_id' => $payment->package_id,
                'payment_id' => $payment->id,
                'status'     => 'ACTIVE',
                'started_at' => now(),
                'expires_at' => now()->addDays($payment->package->duration_days),
            ]);

            dispatch(new SendPackageActiveWaJob($user, $payment->package));
        }
    });
}
```

### 3.4 Load Midtrans Snap di Laravel

```php
// Di app.blade.php atau layout Inertia

<head>
    @if(config('midtrans.is_production'))
        <script src="https://app.midtrans.com/snap/snap.js"
                data-client-key="{{ config('midtrans.client_key') }}"></script>
    @else
        <script src="https://app.sandbox.midtrans.com/snap/snap.js"
                data-client-key="{{ config('midtrans.client_key') }}"></script>
    @endif
</head>
```

-----

## 4. Scheduling System

### 4.1 Alur Slot

```
Dokter set availability (dashboard)
    → POST /doctor/availability
    → INSERT doctor_availabilities (hari, jam_mulai, jam_selesai, durasi_menit)

Sistem generate slots (Artisan command / manual)
    → php artisan slots:generate --doctor=1 --date=2025-05-20
    → INSERT time_slots (doctor_id, start_time, end_time, status=AVAILABLE)

Pasien lihat kalender
    → GET /slots?doctor_id=1&date=2025-05-20
    → Return slot AVAILABLE saja

Pasien pilih slot → LOCK
    → POST /slots/lock { slot_id }
    → time_slots.status = LOCKED
    → time_slots.locked_until = now() + 15 menit
    → time_slots.locked_by_user_id = user_id

Auto-release slot expired (Scheduler)
    → Setiap 1 menit: cek slot LOCKED & locked_until < now()
    → UPDATE status = AVAILABLE, locked_by = null
```

### 4.2 Release Slot — Laravel Scheduler

```php
// app/Console/Kernel.php

protected function schedule(Schedule $schedule): void
{
    // Release slot expired setiap menit
    $schedule->call(function () {
        TimeSlot::where('status', 'LOCKED')
            ->where('locked_until', '<', now())
            ->update([
                'status'             => 'AVAILABLE',
                'locked_by_user_id'  => null,
                'locked_until'       => null,
            ]);
    })->everyMinute();

    // Reminder H-1 jam 08.00
    $schedule->job(new SendReminderDayBeforeJob)->dailyAt('08:00');

    // Reminder H-0 3 jam sebelum konsultasi
    $schedule->call(function () {
        $upcoming = Booking::where('status', 'CONFIRMED')
            ->whereHas('slot', fn($q) =>
                $q->whereBetween('start_time', [now()->addHours(3), now()->addHours(3)->addMinutes(10)])
            )->get();

        foreach ($upcoming as $booking) {
            dispatch(new SendReminderBeforeJob($booking));
        }
    })->everyTenMinutes();
}
```

-----

## 5. Deduction Logic — Kredit Konsultasi

### 5.1 Logika

```
Pasien bayar konsultasi Rp 500.000
    → users.consultation_credit = 500000
    → users.credit_expires_at = now() + 3 bulan

Pasien pilih paket
    → GET /packages/with-credit
        → $finalPrice = $package->price - auth()->user()->consultation_credit
        → Return harga final ke frontend

Frontend tampilkan
    ┌─────────────────────────────────┐
    │ Harga paket        Rp 1.500.000 │
    │ Kredit konsultasi  - Rp 500.000 │
    │ ─────────────────────────────── │
    │ Total bayar        Rp 1.000.000 │
    └─────────────────────────────────┘

Backend validasi sebelum buat transaksi
    1. consultation_credit > 0
    2. credit_expires_at > now()
    3. Booking konsultasi status = DONE
    4. User belum pernah apply credit untuk paket ini

Setelah payment SETTLEMENT
    → users.consultation_credit = 0
    → INSERT user_packages
```

### 5.2 Controller

```php
// PackageController.php

public function withCredit()
{
    $user    = auth()->user();
    $credit  = $user->consultation_credit ?? 0;
    $expired = $user->credit_expires_at && now()->isAfter($user->credit_expires_at);

    $packages = Package::all()->map(function ($pkg) use ($credit, $expired) {
        $finalPrice = $expired ? $pkg->price : max(0, $pkg->price - $credit);
        return [
            ...$pkg->toArray(),
            'original_price'  => $pkg->price,
            'credit_applied'  => $expired ? 0 : min($credit, $pkg->price),
            'final_price'     => $finalPrice,
        ];
    });

    return Inertia::render('Packages/Index', [
        'packages'           => $packages,
        'consultation_credit'=> $expired ? 0 : $credit,
    ]);
}
```

-----

## 6. Dashboard Breakdown

### 6.1 Dashboard Pasien (`/dashboard`)

|Fitur                  |Component                 |Data Source                        |
|-----------------------|--------------------------|-----------------------------------|
|Profil & data kesehatan|`ProfileCard`             |`users` + `user_health_data`       |
|Jadwal konsultasi aktif|`UpcomingBooking`         |`bookings` WHERE status=CONFIRMED  |
|Status & info paket    |`PackageStatus`           |`user_packages` WHERE status=ACTIVE|
|Download meal plan PDF |`MealPlanCard`            |`user_packages.meal_plan_url`      |
|Check-in mingguan      |`CheckInForm`             |INSERT `check_ins`                 |
|Progress chart BB      |`ProgressChart` (Recharts)|`check_ins` ORDER BY week          |
|Notifikasi             |`NotifBell`               |`notifications`                    |

### 6.2 Dashboard Dokter (`/doctor/dashboard`)

|Fitur                               |Component                    |Data Source                                                            |
|------------------------------------|-----------------------------|------------------------------------------------------------------------|
|Workload konsultasi confirmed       |`ConsultationWorkloadCard`   |`bookings` WHERE `doctor_id`=dokter login AND `status`=`confirmed`     |
|Review catatan intake pasien        |`ConsultationWorkloadCard`   |`bookings.notes`                                                        |
|Review dokumen intake pasien        |`ConsultationWorkloadCard`   |`bookings.patient_upload_path`                                         |
|Form notes & rekomendasi paket      |`ConsultationWorkloadCard`   |UPSERT `consultations` + optional relasi `packages`                    |
|Handoff pasien ke package selection |Queue notification follow-up |`SendBookingNotificationJob` type `completion-follow-up`               |
|Set availability jadwal             |`AvailabilityCalendar`       |`doctor_availabilities`                                                |

### 6.3 Dashboard Admin (`/admin/dashboard`)

|Fitur                   |Component         |Data Source                           |
|------------------------|------------------|--------------------------------------|
|Overview pasien & dokter|`KpiCards`        |COUNT dari berbagai tabel             |
|Kelola paket & harga    |`PackageManager`  |CRUD `packages`                       |
|Laporan keuangan        |`RevenueReport`   |`payments` WHERE status=PAID          |
|Analytics konversi      |`ConversionFunnel`|`users` + `bookings` + `user_packages`|
|Broadcast WA            |`WaBroadcast`     |Dispatch `BroadcastWaJob`             |
|Kelola konten           |`ContentManager`  |`educational_content`                 |
|User & role management  |`UserManager`     |`users` + `roles`                     |

-----

## 7. Database Schema

### 7.1 Migration Files

```php
// users
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('email')->unique();
    $table->string('phone')->unique();
    $table->string('password');
    $table->enum('role', ['patient', 'doctor', 'admin'])->default('patient');
    $table->boolean('verified')->default(false);
    $table->unsignedBigInteger('consultation_credit')->default(0);
    $table->timestamp('credit_expires_at')->nullable();
    $table->timestamps();
});

// doctors
Schema::create('doctors', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->string('specialization');
    $table->text('bio')->nullable();
    $table->string('avatar_url')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// packages
Schema::create('packages', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->unsignedBigInteger('price');
    $table->unsignedInteger('duration_days');
    $table->enum('type', ['basic', 'advance', 'vip']);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// doctor_availabilities
Schema::create('doctor_availabilities', function (Blueprint $table) {
    $table->id();
    $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
    $table->tinyInteger('day_of_week'); // 0=Minggu, 1=Senin, dst
    $table->time('start_time');
    $table->time('end_time');
    $table->unsignedInteger('slot_duration_minutes')->default(30);
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// time_slots
Schema::create('time_slots', function (Blueprint $table) {
    $table->id();
    $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
    $table->dateTime('start_time');
    $table->dateTime('end_time');
    $table->enum('status', ['available', 'locked', 'booked'])->default('available');
    $table->timestamp('locked_until')->nullable();
    $table->foreignId('locked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
    $table->timestamps();
});

// bookings
Schema::create('bookings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
    $table->foreignId('slot_id')->constrained('time_slots');
    $table->enum('status', ['pending', 'confirmed', 'done', 'cancelled'])->default('pending');
    $table->string('meeting_link')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});

// payments
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('package_id')->nullable()->constrained()->nullOnDelete();
    $table->unsignedBigInteger('amount');
    $table->enum('type', ['consultation', 'package']);
    $table->string('midtrans_order_id')->unique();
    $table->enum('midtrans_status', ['PENDING', 'PAID', 'FAILED'])->default('PENDING');
    $table->unsignedBigInteger('credit_applied')->default(0);
    $table->timestamps();
});

// user_packages
Schema::create('user_packages', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('package_id')->constrained();
    $table->foreignId('payment_id')->constrained();
    $table->enum('status', ['active', 'completed', 'paused'])->default('active');
    $table->string('meal_plan_url')->nullable();
    $table->timestamp('started_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();
});

// check_ins
Schema::create('check_ins', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_package_id')->constrained()->cascadeOnDelete();
    $table->decimal('weight', 5, 1)->nullable();
    $table->decimal('waist', 5, 1)->nullable();
    $table->string('photo_url')->nullable();
    $table->text('notes')->nullable();
    $table->unsignedInteger('week_number');
    $table->timestamps();
});

// consultations
Schema::create('consultations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
    $table->foreignId('doctor_id')->constrained();
    $table->foreignId('patient_id')->constrained('users');
    $table->foreignId('recommended_package_id')->nullable()->constrained('packages')->nullOnDelete();
    $table->text('doctor_notes')->nullable();
    $table->timestamps();
});
```

-----

## 8. Routes & Controller

### 8.1 `routes/web.php`

```php
// Public
Route::get('/', [LandingController::class, 'index']);

// Auth (Inertia pages)
Route::middleware('guest')->group(function () {
    Route::get('/register',       [AuthController::class, 'showRegister']);
    Route::post('/register',      [AuthController::class, 'register']);
    Route::get('/verify-otp',     [AuthController::class, 'showVerifyOtp']);
    Route::post('/verify-otp',    [AuthController::class, 'verifyOtp']);
    Route::get('/login',          [AuthController::class, 'showLogin']);
    Route::post('/login',         [AuthController::class, 'login']);
});

Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');

// Patient routes
Route::middleware(['auth', 'verified', 'role:patient'])->group(function () {
    Route::get('/dashboard',                    [PatientDashboardController::class, 'index']);
    Route::get('/book-consultation',            [BookingController::class, 'create']);
    Route::post('/booking/create',              [BookingController::class, 'store']);
    Route::get('/checkout/consultation/{id}',  [PaymentController::class, 'showConsultationCheckout']);
    Route::post('/payment/init-consultation',  [PaymentController::class, 'initConsultation']);
    Route::get('/packages',                    [PackageController::class, 'withCredit']);
    Route::post('/payment/init-package',       [PaymentController::class, 'initPackage']);
    Route::get('/checkin',                     [CheckInController::class, 'create']);
    Route::post('/checkin',                    [CheckInController::class, 'store']);
});

// Doctor routes
Route::middleware(['auth', 'role:doctor'])->prefix('doctor')->group(function () {
    Route::get('/dashboard',                  [DoctorDashboardController::class, 'index']);
    Route::get('/availability',               [AvailabilityController::class, 'index']);
    Route::post('/availability',              [AvailabilityController::class, 'store']);
    Route::post('/consultation/{id}/complete',[ConsultationController::class, 'complete']);
    Route::get('/patients',                   [DoctorPatientController::class, 'index']);
    Route::post('/checkin/{id}/review',       [DoctorCheckInController::class, 'review']);
});

// Admin routes
Route::middleware(['auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard',   [AdminDashboardController::class, 'index']);
    Route::resource('/packages', PackageAdminController::class);
    Route::resource('/users',    UserAdminController::class);
    Route::get('/reports',     [ReportController::class, 'index']);
});

// Slot API (used by frontend calendar)
Route::middleware('auth')->group(function () {
    Route::get('/api/slots',      [SlotController::class, 'available']);
    Route::post('/api/slots/lock',[SlotController::class, 'lock']);
    Route::get('/api/doctors',    [DoctorController::class, 'index']);
});

// Midtrans webhook (no auth — verified via signature)
Route::post('/payment/webhook', [PaymentController::class, 'webhook'])
    ->withoutMiddleware(['web'])
    ->middleware('throttle:60,1');
```

-----

## 9. Folder Structure

```
more-clinic/
├── app/
│   ├── Console/
│   │   └── Kernel.php                  # Scheduler (reminder, slot release)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── BookingController.php
│   │   │   ├── PaymentController.php   # Midtrans init + webhook
│   │   │   ├── SlotController.php
│   │   │   ├── PackageController.php
│   │   │   ├── CheckInController.php
│   │   │   ├── ConsultationController.php
│   │   │   ├── Doctor/
│   │   │   │   ├── DoctorDashboardController.php
│   │   │   │   └── AvailabilityController.php
│   │   │   └── Admin/
│   │   │       ├── AdminDashboardController.php
│   │   │       └── ReportController.php
│   │   └── Middleware/
│   │       └── CheckRole.php
│   ├── Jobs/
│   │   ├── SendOtpJob.php
│   │   ├── SendConfirmationWaJob.php
│   │   ├── SendConfirmationEmailJob.php
│   │   ├── SendReminderBeforeJob.php
│   │   └── SendPackageActiveWaJob.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Doctor.php
│   │   ├── Package.php
│   │   ├── TimeSlot.php
│   │   ├── Booking.php
│   │   ├── Payment.php
│   │   ├── UserPackage.php
│   │   ├── CheckIn.php
│   │   └── Consultation.php
│   └── Services/
│       ├── MidtransService.php
│       ├── ZoomService.php
│       └── FonnteService.php           # WA notifikasi
│
├── resources/
│   └── js/
│       ├── Pages/
│       │   ├── Landing.jsx
│       │   ├── Auth/
│       │   │   ├── Register.jsx
│       │   │   ├── VerifyOtp.jsx
│       │   │   └── Login.jsx
│       │   ├── Patient/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── BookConsultation.jsx
│       │   │   ├── Checkout.jsx
│       │   │   ├── Packages.jsx
│       │   │   └── CheckIn.jsx
│       │   ├── Doctor/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Availability.jsx
│       │   │   └── PatientDetail.jsx
│       │   └── Admin/
│       │       ├── Dashboard.jsx
│       │       └── Reports.jsx
│       ├── Components/
│       │   ├── ui/                     # Shadcn components
│       │   ├── BookingCalendar.jsx
│       │   ├── ProgressChart.jsx
│       │   ├── CheckInForm.jsx
│       │   └── PaymentButton.jsx
│       └── Layouts/
│           ├── AppLayout.jsx
│           ├── DoctorLayout.jsx
│           └── AdminLayout.jsx
│
├── database/
│   └── migrations/
│       ├── create_users_table.php
│       ├── create_doctors_table.php
│       ├── create_packages_table.php
│       ├── create_doctor_availabilities_table.php
│       ├── create_time_slots_table.php
│       ├── create_bookings_table.php
│       ├── create_payments_table.php
│       ├── create_user_packages_table.php
│       ├── create_check_ins_table.php
│       └── create_consultations_table.php
│
├── config/
│   └── midtrans.php
│
└── routes/
    └── web.php
```

-----

## Environment Variables

```env
APP_NAME="MORÉ Clinic"
APP_URL=https://moreclinic.id

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=more_clinic
DB_USERNAME=postgres
DB_PASSWORD=secret

MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxx
MIDTRANS_IS_PRODUCTION=false

FONNTE_TOKEN=xxxxx          # WA API
ZOOM_API_KEY=xxxxx
ZOOM_API_SECRET=xxxxx

MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_FROM_ADDRESS=noreply@moreclinic.id
MAIL_FROM_NAME="MORÉ Clinic"

QUEUE_CONNECTION=database   # atau redis jika pakai Redis
```

-----

> **MORÉ Aesthetic and Wellness Centre**  
> Website Technical Spec v1.0  
> *“Satu kali konsultasi membuka pintu ke ekosistem program penuh.”*
