<?php

use App\Jobs\SendBookingNotificationJob;
use App\Models\Booking;
use App\Models\Doctor;
use App\Services\TimeSlotService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('clinic:generate-slots {doctorId} {date}', function () {
    $doctor = Doctor::findOrFail((int) $this->argument('doctorId'));

    app(TimeSlotService::class)->generateForDoctorAndDate($doctor, (string) $this->argument('date'));

    $this->info('Slots generated successfully.');
})->purpose('Generate consultation slots for a doctor and date.');

Schedule::call(fn () => app(TimeSlotService::class)->releaseExpiredLocks())->everyMinute();

Schedule::call(function (): void {
    Booking::query()
        ->with(['patient', 'doctor.user', 'slot'])
        ->where('status', 'confirmed')
        ->whereNull('day_before_reminder_sent_at')
        ->whereHas('slot', fn ($query) => $query->whereBetween('start_time', [now()->addDay()->startOfDay(), now()->addDay()->endOfDay()]))
        ->get()
        ->each(function (Booking $booking): void {
            SendBookingNotificationJob::dispatch($booking, 'day-before-reminder');
            $booking->update(['day_before_reminder_sent_at' => now()]);
        });
})->dailyAt('08:00');

Schedule::call(function (): void {
    Booking::query()
        ->with(['patient', 'doctor.user', 'slot'])
        ->where('status', 'confirmed')
        ->whereNull('same_day_reminder_sent_at')
        ->whereHas('slot', fn ($query) => $query->whereBetween('start_time', [now()->addHours(3), now()->addHours(3)->addMinutes(10)]))
        ->get()
        ->each(function (Booking $booking): void {
            SendBookingNotificationJob::dispatch($booking, 'same-day-reminder');
            $booking->update(['same_day_reminder_sent_at' => now()]);
        });
})->everyTenMinutes();
