<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Services\TimeSlotService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function create(Request $request, TimeSlotService $timeSlotService): Response
    {
        $doctors = Doctor::query()
            ->with('user')
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        $selectedDoctor = $doctors->firstWhere('id', (int) $request->integer('doctor_id')) ?? $doctors->first();
        $selectedDate = $request->string('date')->toString() ?: now()->toDateString();

        $slots = collect();

        if ($selectedDoctor) {
            $timeSlotService->generateForDoctorAndDate($selectedDoctor, $selectedDate);

            $slots = TimeSlot::query()
                ->where('doctor_id', $selectedDoctor->id)
                ->whereDate('start_time', $selectedDate)
                ->where(function ($query): void {
                    $query->where('status', 'available')
                        ->orWhere(function ($lockedQuery): void {
                            $lockedQuery->where('status', 'locked')
                                ->where('locked_until', '<=', now());
                        });
                })
                ->orderBy('start_time')
                ->get();
        }

        return Inertia::render('Patient/BookConsultation', [
            'doctors' => $doctors->map(fn ($doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
                'bio' => $doctor->bio,
                'consultation_fee' => $doctor->consultation_fee,
            ]),
            'filters' => [
                'doctor_id' => $selectedDoctor?->id,
                'date' => $selectedDate,
            ],
            'slots' => $slots->map(fn ($slot) => [
                'id' => $slot->id,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'doctor_id' => ['required', 'integer', 'exists:doctors,id'],
            'slot_id' => ['required', 'integer', 'exists:time_slots,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = DB::transaction(function () use ($request, $data) {
            $slot = TimeSlot::query()->lockForUpdate()->findOrFail($data['slot_id']);

            if ($slot->doctor_id !== $data['doctor_id']) {
                abort(422, 'Selected slot does not belong to this doctor.');
            }

            if (
                $slot->status !== 'locked'
                || $slot->locked_by_user_id !== $request->user()->id
                || ! $slot->locked_until?->isFuture()
            ) {
                abort(422, 'Please lock a valid slot before confirming the booking.');
            }

            $slot->update([
                'locked_until' => now()->addMinutes(15),
            ]);

            return Booking::create([
                'user_id' => $request->user()->id,
                'doctor_id' => $data['doctor_id'],
                'slot_id' => $slot->id,
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);
        });

        return redirect()->route('patient.checkout', $booking)->with('success', 'Booking created. Complete payment to confirm the consultation.');
    }
}
