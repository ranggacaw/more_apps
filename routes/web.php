<?php

use App\Http\Controllers\AdminAestheticProgramController;
use App\Http\Controllers\AdminBookingCalendarController;
use App\Http\Controllers\AdminBookingController;
use App\Http\Controllers\AdminBroadcastController;
use App\Http\Controllers\AdminContentController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminInvoiceController;
use App\Http\Controllers\AdminQueueController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\AdminScheduleSettingsController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\ClinicAssetController;
use App\Http\Controllers\DashboardRedirectController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\DoctorMedicalRecordController;
use App\Http\Controllers\DoctorPackageController;
use App\Http\Controllers\DoctorProgramController;
use App\Http\Controllers\FinanceBalanceSheetController;
use App\Http\Controllers\FinanceBalanceSheetEntryController;
use App\Http\Controllers\FinanceOperatingExpenseController;
use App\Http\Controllers\FinancePaymentAdjustmentController;
use App\Http\Controllers\FinanceProfitLossController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PatientPortalController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SystemDocsController;
use App\Http\Controllers\UserGuideController;
use App\Models\Doctor;
use App\Models\EducationalContent;
use App\Services\ClinicAssetService;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $clinicAssetService = app(ClinicAssetService::class);

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false,
        'doctors' => Doctor::query()
            ->with('user')
            ->where('is_active', true)
            ->take(3)
            ->get()
            ->map(fn ($doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
                'bio' => $doctor->bio,
                'avatar_url' => $clinicAssetService->temporaryAssetUrl($doctor->avatar_url, now()->addMinutes(30)),
            ]),
        'featuredContent' => EducationalContent::query()
            ->where('status', 'published')
            ->orderByDesc('published_at')
            ->take(3)
            ->get()
            ->map(fn ($content) => [
                'id' => $content->id,
                'title' => $content->title,
                'excerpt' => $content->excerpt,
                'body' => $content->body,
                'published_at' => $content->published_at,
            ]),
    ]);
})->name('home');

Route::get('/manifest.webmanifest', function () {
    return response(file_get_contents(public_path('manifest.webmanifest')), 200, [
        'Content-Type' => 'application/manifest+json',
    ]);
})->name('pwa.manifest');

Route::get('/service-worker.js', function () {
    return response(file_get_contents(public_path('service-worker.js')), 200, [
        'Content-Type' => 'application/javascript',
        'Service-Worker-Allowed' => '/',
        'Cache-Control' => 'no-cache',
    ]);
})->name('pwa.service-worker');

Route::get('/offline.html', function () {
    return response(file_get_contents(public_path('offline.html')), 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-cache',
    ]);
})->name('pwa.offline');

Route::get('/clinic-assets/{path}', [ClinicAssetController::class, 'show'])
    ->where('path', '.*')
    ->middleware('signed:relative')
    ->name('clinic-assets.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardRedirectController::class)->name('dashboard');
    Route::get('/user-guide', UserGuideController::class)->name('user-guide');
    Route::get('/system-docs', [SystemDocsController::class, 'index'])->name('system-docs');
    Route::get('/system-docs/{module}', [SystemDocsController::class, 'show'])->name('system-docs.show');
});

Route::middleware(['auth', 'verified', 'role:super_admin,doctor'])->prefix('finance')->name('finance.')->group(function () {
    Route::get('/', fn () => redirect()->route('finance.profit-loss.index'))->name('index');
    Route::get('/profit-loss', FinanceProfitLossController::class)->name('profit-loss.index');
    Route::get('/balance-sheet', FinanceBalanceSheetController::class)->name('balance-sheet.index');
});

Route::middleware(['auth', 'verified', 'role:super_admin'])->prefix('finance')->name('finance.')->group(function () {
    Route::patch('/payment-adjustments/{payment}', [FinancePaymentAdjustmentController::class, 'update'])->name('payment-adjustments.update');
    Route::post('/operating-expenses', [FinanceOperatingExpenseController::class, 'store'])->name('operating-expenses.store');
    Route::patch('/operating-expenses/{operatingExpense}', [FinanceOperatingExpenseController::class, 'update'])->name('operating-expenses.update');
    Route::delete('/operating-expenses/{operatingExpense}', [FinanceOperatingExpenseController::class, 'destroy'])->name('operating-expenses.destroy');
    Route::post('/balance-sheet-entries', [FinanceBalanceSheetEntryController::class, 'store'])->name('balance-sheet-entries.store');
    Route::patch('/balance-sheet-entries/{balanceSheetEntry}', [FinanceBalanceSheetEntryController::class, 'update'])->name('balance-sheet-entries.update');
    Route::delete('/balance-sheet-entries/{balanceSheetEntry}', [FinanceBalanceSheetEntryController::class, 'destroy'])->name('balance-sheet-entries.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:patient'])->prefix('patient')->name('patient.')->group(function () {
    Route::get('/password/change', [\App\Http\Controllers\Auth\PatientPasswordChangeController::class, 'edit'])->name('password.edit');
    Route::put('/password/change', [\App\Http\Controllers\Auth\PatientPasswordChangeController::class, 'update'])->name('password.update');
});

Route::middleware(['auth', 'verified', 'role:patient', 'patient.password.changed'])->prefix('patient')->name('patient.')->group(function () {
    Route::get('/dashboard', [PatientPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/progress', [PatientPortalController::class, 'progress'])->name('progress');
    Route::get('/reports', [PatientPortalController::class, 'reports'])->name('reports.index');
    Route::get('/reports/{consultation}', [PatientPortalController::class, 'showReport'])->name('reports.show');
    Route::get('/medical-records', [PatientPortalController::class, 'medicalRecords'])->name('medical-records.index');
    Route::get('/medical-records/{recordType}/{recordId}', [PatientPortalController::class, 'showMedicalRecord'])
        ->where('recordType', 'consultation|progress')
        ->whereNumber('recordId')
        ->name('medical-records.show');
    Route::post('/program/check-ins/{userPackage}', [PatientPortalController::class, 'storeCheckIn'])->name('program.check-ins.store');
    Route::get('/checkout/{booking}', [PaymentController::class, 'showConsultationCheckout'])->name('checkout');
    Route::get('/packages', [PaymentController::class, 'showPackageCatalog'])->name('packages.index');
});

Route::middleware(['auth', 'verified', 'role:patient', 'patient.password.changed'])->group(function () {
    Route::post('/bookings', [PaymentController::class, 'storeBooking'])->name('bookings.store');
});

Route::middleware(['auth', 'verified', 'role:doctor'])->prefix('doctor')->name('doctor.')->group(function () {
    Route::get('/dashboard', DoctorDashboardController::class)->name('dashboard');
    Route::get('/consultations', [DoctorDashboardController::class, 'consultations'])->name('consultations.index');
    Route::get('/consultations/{booking}', [DoctorDashboardController::class, 'showConsultation'])
        ->whereNumber('booking')
        ->name('consultations.show');
    Route::get('/program-reviews', [DoctorDashboardController::class, 'programReviews'])->name('program-reviews.index');
    Route::get('/medical-records', [DoctorMedicalRecordController::class, 'index'])->name('medical-records.index');
    Route::get('/medical-records/{recordType}/{recordId}', [DoctorMedicalRecordController::class, 'show'])
        ->where('recordType', 'consultation|progress')
        ->whereNumber('recordId')
        ->name('medical-records.show');
    Route::patch('/check-ins/{checkIn}', [DoctorProgramController::class, 'update'])->name('program.check-ins.update');
    Route::post('/bookings/{booking}/complete', [DoctorDashboardController::class, 'complete'])->name('bookings.complete');
    Route::post('/bookings/{booking}/meeting-link', [DoctorDashboardController::class, 'saveMeetingLink'])->name('bookings.meeting-link');
    Route::post('/check-ins/{checkIn}/review', [DoctorProgramController::class, 'review'])->name('program.check-ins.review');
    Route::get('/packages', [DoctorPackageController::class, 'index'])->name('packages.index');
    Route::post('/packages', [DoctorPackageController::class, 'store'])->name('packages.store');
    Route::patch('/packages/{package}', [DoctorPackageController::class, 'update'])->name('packages.update');
    Route::delete('/packages/{package}', [DoctorPackageController::class, 'destroy'])->name('packages.destroy');

    // Walk-in queue doctor routes
    Route::get('/queue/api', [DoctorDashboardController::class, 'queueStatus'])->name('queue.api');
    Route::post('/queue/{entry}/call', [DoctorDashboardController::class, 'callQueueEntry'])->name('queue.call');
    Route::post('/queue/{entry}/start', [DoctorDashboardController::class, 'startQueueConsultation'])->name('queue.start');
    Route::get('/queue/{entry}/workspace', [DoctorDashboardController::class, 'showQueueConsultation'])->name('queue.workspace');
    Route::post('/queue/{entry}/complete', [DoctorDashboardController::class, 'completeQueueConsultation'])->name('queue.complete');
});

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
    Route::get('/calendar', AdminBookingCalendarController::class)->name('calendar.index');
    Route::get('/bookings', [AdminBookingController::class, 'index'])->name('bookings.index');
    Route::get('/bookings/{booking}', [AdminBookingController::class, 'show'])->name('bookings.show');
    Route::get('/admin/slots', [AdminBookingController::class, 'slots'])->name('admin.slots');
    Route::post('/bookings', [AdminBookingController::class, 'store'])->name('bookings.store');
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
    Route::get('/invoices', [AdminInvoiceController::class, 'index'])->name('invoices.index');
    Route::patch('/invoices/{payment}/finalize', [AdminInvoiceController::class, 'finalize'])->name('invoices.finalize');
    Route::patch('/payments/{payment}/finalize-treatment', [AdminInvoiceController::class, 'finalizeTreatmentPayment'])->name('payments.finalize-treatment');
    Route::get('/broadcasts', [AdminBroadcastController::class, 'index'])->name('broadcasts.index');
    Route::post('/broadcasts', [AdminBroadcastController::class, 'store'])->name('broadcasts.store');
    Route::get('/content', [AdminContentController::class, 'index'])->name('content.index');
    Route::post('/content', [AdminContentController::class, 'store'])->name('content.store');
    Route::patch('/content/{content}', [AdminContentController::class, 'update'])->name('content.update');
    Route::get('/aesthetic-programs', [AdminAestheticProgramController::class, 'index'])->name('aesthetic-programs.index');
    Route::post('/aesthetic-programs', [AdminAestheticProgramController::class, 'store'])->name('aesthetic-programs.store');
    Route::patch('/aesthetic-programs/{aestheticProgram}', [AdminAestheticProgramController::class, 'update'])->name('aesthetic-programs.update');
    Route::delete('/aesthetic-programs/{aestheticProgram}', [AdminAestheticProgramController::class, 'destroy'])->name('aesthetic-programs.destroy');
    Route::get('/schedule-settings', [AdminScheduleSettingsController::class, 'index'])->name('schedule-settings.index');
    Route::post('/schedule-settings/hours', [AdminScheduleSettingsController::class, 'store'])->name('schedule-settings.hours.store');
    Route::patch('/schedule-settings/hours/{clinicHour}', [AdminScheduleSettingsController::class, 'update'])->name('schedule-settings.hours.update');
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');

    // Walk-in queue routes
    Route::get('/queue', [AdminQueueController::class, 'index'])->name('queue.index');
    Route::get('/queue/api', [AdminQueueController::class, 'api'])->name('queue.api');
    Route::post('/queue', [AdminQueueController::class, 'store'])->name('queue.store');
    Route::patch('/queue/bookings/{booking}/check-in', [AdminQueueController::class, 'checkInBooking'])->name('queue.bookings.check-in');
    Route::patch('/queue/bookings/{booking}/no-show', [AdminQueueController::class, 'markBookingNoShow'])->name('queue.bookings.no-show');
    Route::patch('/queue/{entry}/assign', [AdminQueueController::class, 'assign'])->name('queue.assign');
    Route::patch('/queue/{entry}/cancel', [AdminQueueController::class, 'cancel'])->name('queue.cancel');
});

Route::post('/payment/webhook', [PaymentController::class, 'webhook'])
    ->withoutMiddleware(['web'])
    ->middleware('throttle:60,1')
    ->name('payments.webhook');

require __DIR__.'/auth.php';
