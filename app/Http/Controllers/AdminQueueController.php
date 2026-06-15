<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\ClinicQueueEntry;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminQueueController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Queue', $this->getQueueData());
    }

    public function api()
    {
        return response()->json($this->getQueueData());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'patient_phone' => 'nullable|string|max:50',
            'complaint_notes' => 'nullable|string',
            'doctor_id' => ['nullable', 'integer', Rule::exists('doctors', 'id')->where('is_active', true)],
        ]);

        ClinicQueueEntry::createWithNextQueueNumber([
            'source_type' => 'walk_in',
            'patient_name' => $validated['patient_name'],
            'patient_phone' => $validated['patient_phone'] ?? null,
            'complaint_notes' => $validated['complaint_notes'] ?? null,
            'doctor_id' => $validated['doctor_id'] ?? null,
            'assigned_at' => filled($validated['doctor_id'] ?? null) ? now() : null,
        ]);

        return back()->with('success', 'Patient added to queue successfully.');
    }

    public function assign(Request $request, ClinicQueueEntry $entry)
    {
        if ($entry->status !== 'waiting') {
            return back()->withErrors(['error' => 'Only waiting patients can be assigned.']);
        }

        if ($entry->source_type === 'booking') {
            return back()->withErrors(['error' => 'Booking-linked arrivals inherit their scheduled doctor.']);
        }

        $validated = $request->validate([
            'doctor_id' => 'required|exists:doctors,id',
        ]);

        $doctor = Doctor::findOrFail($validated['doctor_id']);
        if (!$doctor->is_active) {
            return back()->withErrors(['error' => 'Doctor is not active.']);
        }

        $entry->update([
            'doctor_id' => $doctor->id,
            'assigned_at' => now(),
        ]);

        return back()->with('success', 'Patient assigned to doctor successfully.');
    }

    public function checkInBooking(Booking $booking)
    {
        DB::transaction(function () use ($booking): void {
            $lockedBooking = Booking::query()
                ->with(['patient', 'slot', 'queueEntry'])
                ->lockForUpdate()
                ->findOrFail($booking->id);

            $this->ensureBookingCanArrive($lockedBooking);

            ClinicQueueEntry::createWithNextQueueNumber([
                'source_type' => 'booking',
                'booking_id' => $lockedBooking->id,
                'patient_name' => $lockedBooking->patientDisplayName(),
                'patient_phone' => $lockedBooking->patientContactPhone(),
                'complaint_notes' => $lockedBooking->notes,
                'doctor_id' => $lockedBooking->doctor_id,
            ]);
        });

        return back()->with('success', 'Booking checked in and queue number assigned.');
    }

    public function markBookingNoShow(Booking $booking)
    {
        DB::transaction(function () use ($booking): void {
            $lockedBooking = Booking::query()
                ->with(['slot', 'queueEntry'])
                ->lockForUpdate()
                ->findOrFail($booking->id);

            $this->ensureBookingCanArrive($lockedBooking);

            $lockedBooking->update([
                'status' => 'no_show',
                'no_show_at' => now(),
            ]);
        });

        return back()->with('success', 'Booking marked as no-show.');
    }

    public function cancel(ClinicQueueEntry $entry)
    {
        if (!in_array($entry->status, ['waiting', 'assigned'])) {
            return back()->withErrors(['error' => 'Only waiting or assigned patients can be cancelled.']);
        }

        $entry->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return back()->with('success', 'Queue entry cancelled.');
    }

    private function getQueueData(): array
    {
        $today = now()->toDateString();
        $todayQueueScope = function ($query) use ($today): void {
            $query->where('queue_date', $today)
                ->orWhere(function ($query) use ($today): void {
                    $query->whereNull('queue_date')->whereDate('queued_at', $today);
                });
        };

        $entries = ClinicQueueEntry::active()
            ->where($todayQueueScope)
            ->with(['doctor.user', 'booking.patient', 'booking.slot'])
            ->orderBy('queue_sequence', 'asc')
            ->orderBy('id', 'asc')
            ->get()
            ->map(fn (ClinicQueueEntry $entry) => $this->mapQueueEntry($entry));

        $grouped = [
            'waiting' => $entries->where('status', 'waiting')->values(),
            'assigned' => $entries->where('status', 'assigned')->values(),
            'in_consultation' => $entries->where('status', 'in_consultation')->values(),
        ];

        $doctors = Doctor::with('user')
            ->where('is_active', true)
            ->get()
            ->map(function ($doctor) {
                $currentQueueEntry = ClinicQueueEntry::where('doctor_id', $doctor->id)
                    ->where('queue_date', now()->toDateString())
                    ->whereIn('status', ['assigned', 'in_consultation'])
                    ->orderBy('queue_sequence', 'asc')
                    ->orderBy('id', 'asc')
                    ->first();

                return [
                    'id' => $doctor->id,
                    'name' => $doctor->user->name,
                    'specialization' => $doctor->specialization,
                    'is_active' => $doctor->is_active,
                    'current_patient' => $currentQueueEntry ? [
                        'id' => $currentQueueEntry->id,
                        'queue_number' => $currentQueueEntry->queue_number,
                        'patient_name' => $currentQueueEntry->patient_name,
                        'source_type' => $currentQueueEntry->source_type,
                        'status' => $currentQueueEntry->status,
                    ] : null,
                ];
            });

        $todaysOfflineBookings = Booking::query()
            ->with(['patient', 'doctor.user', 'slot', 'queueEntry'])
            ->whereIn('status', ['confirmed', 'completed', 'no_show'])
            ->where('consultation_mode', 'offline')
            ->whereHas('slot', fn ($query) => $query->whereDate('start_time', $today))
            ->get();

        $notArrivedBookings = $todaysOfflineBookings
            ->filter(fn (Booking $booking): bool => $booking->status === 'confirmed' && $booking->queueEntry === null)
            ->sortBy(fn (Booking $booking): int => (int) ($booking->slot?->start_time?->timestamp ?? 0))
            ->map(fn (Booking $booking) => $this->mapNotArrivedBooking($booking))
            ->values();

        $allTodayEntries = ClinicQueueEntry::query()
            ->where($todayQueueScope)
            ->get();

        return [
            'queue' => $grouped,
            'notArrivedBookings' => $notArrivedBookings,
            'doctors' => $doctors,
            'summary' => [
                'total_same_day_bookings' => $todaysOfflineBookings->count(),
                'not_arrived_bookings' => $notArrivedBookings->count(),
                'checked_in_patients' => $allTodayEntries->where('source_type', 'booking')->whereNotIn('status', ['cancelled'])->count(),
                'active_queue_patients' => $entries->count(),
                'completed_consultations' => $allTodayEntries->where('status', 'completed')->count(),
                'no_show_bookings' => $todaysOfflineBookings->where('status', 'no_show')->count(),
            ],
        ];
    }

    private function ensureBookingCanArrive(Booking $booking): void
    {
        if ($booking->status !== 'confirmed') {
            throw ValidationException::withMessages(['booking' => 'Only confirmed bookings can be checked in or marked no-show.']);
        }

        if ($booking->consultation_mode !== 'offline') {
            throw ValidationException::withMessages(['booking' => 'Only offline bookings use the arrival queue.']);
        }

        if (! $booking->slot?->start_time?->isToday()) {
            throw ValidationException::withMessages(['booking' => 'Only same-day bookings can be checked in or marked no-show.']);
        }

        if ($booking->queueEntry !== null) {
            throw ValidationException::withMessages(['booking' => 'This booking already has a queue entry.']);
        }
    }

    private function mapQueueEntry(ClinicQueueEntry $entry): array
    {
        return [
            'id' => $entry->id,
            'source_type' => $entry->source_type ?? 'walk_in',
            'source_label' => $entry->source_type === 'booking' ? 'Booking arrival' : 'Walk-in',
            'booking_id' => $entry->booking_id,
            'queue_number' => $entry->queue_number,
            'queue_date' => $entry->queue_date?->toDateString(),
            'queue_sequence' => $entry->queue_sequence,
            'patient_name' => $entry->patient_name,
            'patient_phone' => $entry->patient_phone,
            'complaint_notes' => $entry->complaint_notes,
            'doctor_id' => $entry->doctor_id,
            'doctor_name' => $entry->doctor?->user?->name,
            'booking_start_time' => $entry->booking?->slot?->start_time?->toIso8601String(),
            'status' => $entry->status,
            'queued_at' => $entry->queued_at?->toIso8601String(),
            'assigned_at' => $entry->assigned_at?->toIso8601String(),
            'called_at' => $entry->called_at?->toIso8601String(),
            'consultation_started_at' => $entry->consultation_started_at?->toIso8601String(),
            'completed_at' => $entry->completed_at?->toIso8601String(),
        ];
    }

    private function mapNotArrivedBooking(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'patient_name' => $booking->patientDisplayName(),
            'patient_phone' => $booking->patientContactPhone(),
            'doctor_id' => $booking->doctor_id,
            'doctor_name' => $booking->doctor?->user?->name,
            'start_time' => $booking->slot?->start_time?->toIso8601String(),
            'notes' => $booking->notes,
            'is_guest' => $booking->isGuestBooking(),
        ];
    }
}
