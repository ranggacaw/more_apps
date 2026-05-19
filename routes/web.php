<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminBroadcastController;
use App\Http\Controllers\AdminCheckInController;
use App\Http\Controllers\AdminContentController;
use App\Http\Controllers\AdminPackageController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardRedirectController;
use App\Http\Controllers\DoctorAvailabilityController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\DoctorDashboardController;
use App\Http\Controllers\DoctorProgramController;
use App\Http\Controllers\PatientDashboardController;
use App\Http\Controllers\PatientProgramController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SlotController;
use App\Models\Doctor;
use App\Models\EducationalContent;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
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

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardRedirectController::class)->name('dashboard');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:patient'])->group(function () {
    Route::get('/patient/dashboard', PatientDashboardController::class)->name('patient.dashboard');
    Route::get('/api/doctors', [DoctorController::class, 'index'])->name('api.doctors');
    Route::get('/api/slots', [SlotController::class, 'available'])->name('api.slots');
    Route::post('/patient/user-packages/{userPackage}/check-ins', [PatientProgramController::class, 'storeCheckIn'])->name('patient.program.check-ins.store');
    Route::get('/patient/packages', [PaymentController::class, 'showPackageCatalog'])->name('patient.packages.index');
    Route::get('/book-consultation', [BookingController::class, 'create'])->name('bookings.create');
    Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store');
    Route::post('/bookings/{booking}/uploads', [BookingController::class, 'uploadDocument'])->name('bookings.upload');
    Route::get('/checkout/consultation/{booking}', [PaymentController::class, 'showConsultationCheckout'])->name('patient.checkout');
    Route::post('/payments/init-consultation', [PaymentController::class, 'initConsultation'])->name('payments.init');
    Route::post('/payments/init-package', [PaymentController::class, 'initPackage'])->name('payments.packages.init');
    Route::post('/payments/{payment}/simulate', [PaymentController::class, 'simulate'])->name('payments.simulate');
    Route::post('/slots/lock', [SlotController::class, 'lock'])->name('slots.lock');
});

Route::middleware(['auth', 'verified', 'role:doctor'])->prefix('doctor')->name('doctor.')->group(function () {
    Route::get('/dashboard', DoctorDashboardController::class)->name('dashboard');
    Route::post('/bookings/{booking}/complete', [DoctorDashboardController::class, 'complete'])->name('bookings.complete');
    Route::post('/check-ins/{checkIn}/review', [DoctorProgramController::class, 'review'])->name('program.check-ins.review');
    Route::get('/availability', DoctorAvailabilityController::class)->name('availability.index');
    Route::post('/availability', [DoctorAvailabilityController::class, 'store'])->name('availability.store');
});

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
    Route::get('/packages', [AdminPackageController::class, 'index'])->name('packages.index');
    Route::post('/packages', [AdminPackageController::class, 'store'])->name('packages.store');
    Route::patch('/packages/{package}', [AdminPackageController::class, 'update'])->name('packages.update');
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
    Route::get('/broadcasts', [AdminBroadcastController::class, 'index'])->name('broadcasts.index');
    Route::post('/broadcasts', [AdminBroadcastController::class, 'store'])->name('broadcasts.store');
    Route::get('/content', [AdminContentController::class, 'index'])->name('content.index');
    Route::post('/content', [AdminContentController::class, 'store'])->name('content.store');
    Route::patch('/content/{content}', [AdminContentController::class, 'update'])->name('content.update');
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::post('/user-packages/{userPackage}/check-ins', [AdminCheckInController::class, 'store'])->name('user-packages.check-ins.store');
});

Route::post('/payment/webhook', [PaymentController::class, 'webhook'])
    ->withoutMiddleware(['web'])
    ->middleware('throttle:60,1')
    ->name('payments.webhook');

require __DIR__.'/auth.php';
