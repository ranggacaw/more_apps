<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\ClinicOperatingHour;
use App\Models\Doctor;
use App\Models\Payment;
use App\Models\TimeSlot;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TimeSlotService
{
    public function generateUpcomingSlotsForDoctor(Doctor $doctor, int $days = 21): void
    {
        $startDate = CarbonImmutable::today();

        foreach (range(0, $days - 1) as $offset) {
            $this->generateForDoctorAndDate($doctor, $startDate->addDays($offset));
        }
    }

    public function generateForDoctorAndDate(Doctor $doctor, CarbonInterface|string $date, bool $respectClinicHours = true): void
    {
        if (! $doctor->is_active) {
            return;
        }

        $targetDate = CarbonImmutable::parse($date)->startOfDay();

        $windows = $respectClinicHours
            ? $this->operatingHoursForDate($targetDate)
            : collect([(object) ['start_time' => '00:00:00', 'end_time' => '23:59:59']]);

        $windows->each(fn ($window) => $this->generateSlotsForWindowAndDate(
            $doctor,
            $targetDate,
            (string) $window->start_time,
            (string) $window->end_time,
            $respectClinicHours,
        ));
    }

    public function getReservableSlotsForDoctorAndDate(Doctor $doctor, CarbonInterface|string $date, ?int $userId = null, bool $respectClinicHours = true): Collection
    {
        if (! $doctor->is_active) {
            return collect();
        }

        $targetDate = CarbonImmutable::parse($date)->startOfDay();
        $now = now();

        $this->generateForDoctorAndDate($doctor, $targetDate, $respectClinicHours);

        $slots = TimeSlot::query()
            ->where('doctor_id', $doctor->id)
            ->whereDate('start_time', $targetDate->toDateString())
            ->where('start_time', '>', $now)
            ->where(function ($query) use ($now, $userId): void {
                $query->where('status', 'available')
                    ->orWhere(function ($lockedQuery) use ($now, $userId): void {
                        $lockedQuery->where('status', 'locked')
                            ->where(function ($reservableLockQuery) use ($now, $userId): void {
                                $reservableLockQuery->where('locked_until', '<=', $now);

                                if ($userId) {
                                    $reservableLockQuery->orWhere(function ($ownLockQuery) use ($now, $userId): void {
                                        $ownLockQuery->where('locked_by_user_id', $userId)
                                            ->where('locked_until', '>', $now);
                                    });
                                }
                            });
                    });
            })
            ->orderBy('start_time')
            ->get();

        if (! $respectClinicHours) {
            return $slots;
        }

        return $slots
            ->filter(fn (TimeSlot $slot) => $this->isSlotWithinClinicHours($slot))
            ->values();
    }

    public function isSlotWithinClinicHours(TimeSlot $slot): bool
    {
        return $this->isDateTimeRangeWithinClinicHours($slot->start_time, $slot->end_time);
    }

    public function isDateTimeRangeWithinClinicHours(CarbonInterface|string $start, CarbonInterface|string $end): bool
    {
        $slotStart = CarbonImmutable::parse($start);
        $slotEnd = CarbonImmutable::parse($end);
        $hours = $this->operatingHoursForDate($slotStart);

        if ($hours->isEmpty()) {
            return true;
        }

        return $hours
            ->contains(function (ClinicOperatingHour $hour) use ($slotStart, $slotEnd): bool {
                $windowStart = CarbonImmutable::parse($slotStart->toDateString().' '.$hour->start_time);
                $windowEnd = CarbonImmutable::parse($slotStart->toDateString().' '.$hour->end_time);

                return $slotStart->gte($windowStart) && $slotEnd->lte($windowEnd);
            });
    }

    public function clinicHoursPayloadForDate(CarbonInterface|string $date): array
    {
        $targetDate = CarbonImmutable::parse($date)->startOfDay();

        return $this->operatingHoursForDate($targetDate)
            ->map(fn (ClinicOperatingHour $hour) => [
                'day_of_week' => $hour->day_of_week,
                'start_time' => substr((string) $hour->start_time, 0, 5),
                'end_time' => substr((string) $hour->end_time, 0, 5),
            ])
            ->values()
            ->all();
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

    private function generateSlotsForWindowAndDate(Doctor $doctor, CarbonImmutable $date, string $startTime, string $endTime, bool $respectClinicHours = true): void
    {
        $slotStart = CarbonImmutable::parse($date->toDateString().' '.$startTime);
        $windowEnd = CarbonImmutable::parse($date->toDateString().' '.$endTime);
        $slotDurationMinutes = (int) config('clinic.slot_duration_minutes', 30);

        while ($slotStart->lt($windowEnd)) {
            $slotEnd = $slotStart->addMinutes($slotDurationMinutes);

            if ($slotEnd->gt($windowEnd)) {
                break;
            }

            if ($slotStart->isFuture() && (! $respectClinicHours || $this->isDateTimeRangeWithinClinicHours($slotStart, $slotEnd))) {
                TimeSlot::query()->firstOrCreate(
                    [
                        'doctor_id' => $doctor->id,
                        'start_time' => $slotStart,
                    ],
                    [
                        'availability_id' => null,
                        'end_time' => $slotEnd,
                        'status' => 'available',
                    ],
                );
            }

            $slotStart = $slotEnd;
        }
    }

    /**
     * @return Collection<int, ClinicOperatingHour>
     */
    private function operatingHoursForDate(CarbonImmutable $date): Collection
    {
        return ClinicOperatingHour::query()
            ->where('day_of_week', $date->dayOfWeek)
            ->where('is_active', true)
            ->orderBy('start_time')
            ->get();
    }
}
