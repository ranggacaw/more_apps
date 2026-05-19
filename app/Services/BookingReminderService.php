<?php

namespace App\Services;

use App\Jobs\SendBookingNotificationJob;
use App\Models\Booking;

class BookingReminderService
{
    public function queueDayBeforeReminders(): int
    {
        $bookings = Booking::query()
            ->with(['patient', 'doctor.user', 'slot'])
            ->where('status', 'confirmed')
            ->whereNull('day_before_reminder_sent_at')
            ->whereHas('slot', fn ($query) => $query->whereBetween('start_time', [
                now()->addDay()->startOfDay(),
                now()->addDay()->endOfDay(),
            ]))
            ->get();

        $bookings->each(function (Booking $booking): void {
            SendBookingNotificationJob::dispatch($booking, 'day-before-reminder');
            $booking->update(['day_before_reminder_sent_at' => now()]);
        });

        return $bookings->count();
    }

    public function queueSameDayReminders(): int
    {
        $windowStart = now()->addMinutes((int) config('clinic.reminders.same_day_lead_minutes', 180));
        $windowEnd = $windowStart->copy()->addMinutes((int) config('clinic.reminders.same_day_window_minutes', 10));

        $bookings = Booking::query()
            ->with(['patient', 'doctor.user', 'slot'])
            ->where('status', 'confirmed')
            ->whereNull('same_day_reminder_sent_at')
            ->whereHas('slot', fn ($query) => $query->whereBetween('start_time', [$windowStart, $windowEnd]))
            ->get();

        $bookings->each(function (Booking $booking): void {
            SendBookingNotificationJob::dispatch($booking, 'same-day-reminder');
            $booking->update(['same_day_reminder_sent_at' => now()]);
        });

        return $bookings->count();
    }
}
