<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminBookingCalendarController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $validated = $request->validate([
            'view' => ['nullable', Rule::in(['month', 'week', 'day'])],
            'date' => ['nullable', 'date'],
            'doctor_id' => ['nullable', 'integer', Rule::exists('doctors', 'id')->where('is_active', true)],
            'status' => ['nullable', Rule::in(['pending', 'confirmed', 'completed', 'no_show', 'cancelled'])],
            'mode' => ['nullable', Rule::in(['offline', 'online'])],
        ]);

        $view = $validated['view'] ?? 'month';
        $selectedDate = isset($validated['date']) ? Carbon::parse($validated['date']) : now();
        $selectedDateString = $selectedDate->toDateString();
        $todayString = now()->toDateString();

        [$rangeStart, $rangeEnd] = $this->resolveRange($view, $selectedDate);

        $bookings = Booking::query()
            ->with(['patient', 'doctor.user', 'slot', 'queueEntry'])
            ->whereHas('slot', fn ($query) => $query->whereBetween('start_time', [$rangeStart->startOfDay(), $rangeEnd->endOfDay()]))
            ->when($validated['doctor_id'] ?? null, fn ($query, $doctorId) => $query->where('doctor_id', $doctorId))
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['mode'] ?? null, fn ($query, $mode) => $query->where('consultation_mode', $mode))
            ->get();

        $countsByDate = $bookings
            ->filter(fn (Booking $booking) => $booking->slot?->start_time !== null)
            ->groupBy(fn (Booking $booking) => $booking->slot->start_time->toDateString())
            ->map->count();

        $selectedBookings = $bookings
            ->filter(fn (Booking $booking) => $booking->slot?->start_time?->isSameDay($selectedDate))
            ->sortBy(fn (Booking $booking): int => (int) ($booking->slot?->start_time?->timestamp ?? 0))
            ->values()
            ->map(fn (Booking $booking) => $this->mapBooking($booking))
            ->values();

        $doctors = Doctor::query()
            ->with('user')
            ->where('is_active', true)
            ->orderBy('id')
            ->get()
            ->map(fn (Doctor $doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user?->name ?? 'Unknown doctor',
                'specialization' => $doctor->specialization,
            ])
            ->values();

        return Inertia::render('Admin/BookingCalendar', [
            'view' => $view,
            'selectedDate' => $selectedDateString,
            'today' => $todayString,
            'rangeLabel' => $this->resolveRangeLabel($view, $selectedDate),
            'prevDate' => $this->resolveStepDate($view, $selectedDate, -1)->toDateString(),
            'nextDate' => $this->resolveStepDate($view, $selectedDate, 1)->toDateString(),
            'weekStartsOn' => Carbon::SUNDAY,
            'calendarDays' => $this->buildCalendarDays($view, $rangeStart, $rangeEnd, $selectedDate, $countsByDate),
            'selectedBookings' => $selectedBookings,
            'doctors' => $doctors,
            'statuses' => [
                ['value' => 'pending', 'label' => 'Pending'],
                ['value' => 'confirmed', 'label' => 'Confirmed'],
                ['value' => 'completed', 'label' => 'Completed'],
                ['value' => 'no_show', 'label' => 'No-show'],
                ['value' => 'cancelled', 'label' => 'Cancelled'],
            ],
            'modes' => [
                ['value' => 'offline', 'label' => 'On-site'],
                ['value' => 'online', 'label' => 'Online'],
            ],
            'filters' => [
                'doctor_id' => isset($validated['doctor_id']) ? (string) $validated['doctor_id'] : '',
                'status' => $validated['status'] ?? '',
                'mode' => $validated['mode'] ?? '',
            ],
            'summary' => [
                'visible_bookings' => $bookings->count(),
                'selected_bookings' => $selectedBookings->count(),
            ],
        ]);
    }

    private function resolveRange(string $view, Carbon $selectedDate): array
    {
        if ($view === 'week') {
            $start = $selectedDate->copy()->startOfWeek(Carbon::SUNDAY);

            return [$start, $start->copy()->addDays(6)];
        }

        if ($view === 'day') {
            return [$selectedDate->copy(), $selectedDate->copy()];
        }

        $start = $selectedDate->copy()->startOfMonth()->startOfWeek(Carbon::SUNDAY);
        $end = $selectedDate->copy()->endOfMonth()->endOfWeek(Carbon::SUNDAY);

        return [$start, $end];
    }

    private function resolveStepDate(string $view, Carbon $selectedDate, int $direction): Carbon
    {
        return match ($view) {
            'week' => $selectedDate->copy()->addWeeks($direction),
            'day' => $selectedDate->copy()->addDays($direction),
            default => $selectedDate->copy()->addMonths($direction),
        };
    }

    private function resolveRangeLabel(string $view, Carbon $selectedDate): string
    {
        if ($view === 'day') {
            return $selectedDate->format('l, j F Y');
        }

        return $selectedDate->format('F Y');
    }

    private function buildCalendarDays(string $view, Carbon $rangeStart, Carbon $rangeEnd, Carbon $selectedDate, $countsByDate): array
    {
        $selectedDateString = $selectedDate->toDateString();
        $todayString = now()->toDateString();
        $selectedMonth = $selectedDate->month;
        $cursor = $rangeStart->copy()->startOfDay();
        $end = $rangeEnd->copy()->startOfDay();
        $days = [];

        while ($cursor->lessThanOrEqualTo($end)) {
            $dateString = $cursor->toDateString();
            $days[] = [
                'date' => $dateString,
                'day' => (int) $cursor->format('j'),
                'weekday' => (int) $cursor->format('w'),
                'is_today' => $dateString === $todayString,
                'is_selected' => $dateString === $selectedDateString,
                'is_current_month' => $view === 'month' ? $cursor->month === $selectedMonth : true,
                'booking_count' => (int) ($countsByDate[$dateString] ?? 0),
            ];
            $cursor = $cursor->addDay();
        }

        return $days;
    }

    private function mapBooking(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'patient_name' => $booking->patientDisplayName(),
            'patient_phone' => $booking->patientContactPhone(),
            'is_guest' => $booking->isGuestBooking(),
            'patient_type_label' => $booking->isGuestBooking() ? 'Guest' : 'Registered',
            'doctor_name' => $booking->doctor?->user?->name ?? 'Unassigned',
            'doctor_id' => $booking->doctor_id,
            'start_time' => $booking->slot?->start_time?->toIso8601String(),
            'end_time' => $booking->slot?->end_time?->toIso8601String(),
            'consultation_mode' => $booking->consultation_mode,
            'status' => $booking->status,
            'queue_number' => $booking->queueEntry?->queue_number,
            'queue_status' => $booking->queueEntry?->status,
            'review_href' => route('admin.bookings.show', $booking),
        ];
    }
}
