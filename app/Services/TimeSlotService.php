<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\DoctorAvailability;
use App\Models\Payment;
use App\Models\TimeSlot;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

class TimeSlotService
{
    public function generateUpcomingSlots(DoctorAvailability $availability, int $days = 21): void
    {
        $startDate = CarbonImmutable::today();

        foreach (range(0, $days - 1) as $offset) {
            $date = $startDate->addDays($offset);

            if ($date->dayOfWeek !== $availability->day_of_week) {
                continue;
            }

            $this->generateSlotsForAvailabilityAndDate($availability, $date);
        }
    }

    public function generateForDoctorAndDate(Doctor $doctor, CarbonInterface|string $date): void
    {
        $targetDate = CarbonImmutable::parse($date)->startOfDay();

        $doctor->availabilities()
            ->where('day_of_week', $targetDate->dayOfWeek)
            ->where('is_active', true)
            ->get()
            ->each(fn (DoctorAvailability $availability) => $this->generateSlotsForAvailabilityAndDate($availability, $targetDate));
    }

    public function releaseExpiredLocks(): int
    {
        $expiredSlots = TimeSlot::query()
            ->where('status', 'locked')
            ->whereNotNull('locked_until')
            ->where('locked_until', '<=', now())
            ->pluck('id');

        if ($expiredSlots->isEmpty()) {
            return 0;
        }

        DB::transaction(function () use ($expiredSlots): void {
            Payment::query()
                ->whereIn('booking_id', function ($query) use ($expiredSlots): void {
                    $query->select('id')
                        ->from('bookings')
                        ->whereIn('slot_id', $expiredSlots)
                        ->where('status', 'pending');
                })
                ->where('status', 'pending')
                ->update([
                    'status' => 'failed',
                    'payload' => ['reason' => 'slot_lock_expired'],
                ]);

            Booking::query()
                ->whereIn('slot_id', $expiredSlots)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            TimeSlot::query()
                ->whereIn('id', $expiredSlots)
                ->update([
                    'status' => 'available',
                    'locked_until' => null,
                    'locked_by_user_id' => null,
                ]);
        });

        return $expiredSlots->count();
    }

    private function generateSlotsForAvailabilityAndDate(DoctorAvailability $availability, CarbonImmutable $date): void
    {
        $slotStart = CarbonImmutable::parse($date->toDateString().' '.$availability->start_time);
        $windowEnd = CarbonImmutable::parse($date->toDateString().' '.$availability->end_time);

        while ($slotStart->lt($windowEnd)) {
            $slotEnd = $slotStart->addMinutes($availability->slot_duration_minutes);

            if ($slotEnd->gt($windowEnd)) {
                break;
            }

            if ($slotStart->isFuture()) {
                TimeSlot::query()->firstOrCreate(
                    [
                        'doctor_id' => $availability->doctor_id,
                        'start_time' => $slotStart,
                    ],
                    [
                        'availability_id' => $availability->id,
                        'end_time' => $slotEnd,
                        'status' => 'available',
                    ],
                );
            }

            $slotStart = $slotEnd;
        }
    }
}
