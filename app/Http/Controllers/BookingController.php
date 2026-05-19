<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Services\ClinicAssetService;
use App\Services\TimeSlotService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
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
            $slots = $timeSlotService->getReservableSlotsForDoctorAndDate(
                $selectedDoctor,
                $selectedDate,
                $request->user()->id,
            );
        }

        return Inertia::render('Patient/BookConsultation', [
            'doctors' => $doctors->map(fn ($doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
                'bio' => $doctor->bio,
                'avatar_url' => $doctor->avatar_url,
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
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')->where('is_active', true)],
            'slot_id' => ['required', 'integer', 'exists:time_slots,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = DB::transaction(function () use ($request, $data) {
            $slot = TimeSlot::query()->with('doctor')->lockForUpdate()->findOrFail($data['slot_id']);

            if ($slot->doctor_id !== $data['doctor_id'] || ! $slot->doctor?->is_active) {
                abort(422, 'Selected slot does not belong to this doctor.');
            }

            if (! $slot->start_time->isFuture()) {
                abort(422, 'Please select a future slot before confirming the booking.');
            }

            if (
                $slot->status !== 'locked'
                || $slot->locked_by_user_id !== $request->user()->id
                || ! $slot->locked_until?->isFuture()
            ) {
                abort(422, 'Please lock a valid slot before confirming the booking.');
            }

            $activeBooking = Booking::query()
                ->lockForUpdate()
                ->where('slot_id', $slot->id)
                ->whereIn('status', ['pending', 'confirmed', 'completed'])
                ->latest('id')
                ->first();

            if ($activeBooking) {
                if ($activeBooking->status !== 'pending') {
                    abort(422, 'This slot already has an active booking.');
                }

                abort_unless($activeBooking->user_id === $request->user()->id, 422, 'This slot already belongs to another active booking.');

                $slot->update([
                    'locked_until' => now()->addMinutes(15),
                ]);

                return $activeBooking;
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

    public function uploadDocument(Request $request, Booking $booking, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        abort_unless($booking->user_id === $request->user()->id, 403);

        $request->validate([
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $booking->update([
            'patient_upload_path' => $clinicAssetService->storePatientUpload($booking, $request->file('document')),
        ]);

        return back()->with('success', 'Patient document uploaded.');
    }
}
