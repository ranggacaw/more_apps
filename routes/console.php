<?php

use App\Models\Doctor;
use App\Services\BookingReminderService;
use App\Services\ProgramReminderService;
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

Schedule::call(fn () => app(BookingReminderService::class)->queueDayBeforeReminders())
    ->dailyAt((string) config('clinic.reminders.day_before_at', '08:00'));

Schedule::call(fn () => app(BookingReminderService::class)->queueSameDayReminders())->everyTenMinutes();

Schedule::call(fn () => app(ProgramReminderService::class)->queueWeeklyCheckInReminders())
    ->dailyAt((string) config('clinic.reminders.weekly_check_in_at', '09:00'));
