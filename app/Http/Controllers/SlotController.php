<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Services\TimeSlotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SlotController extends Controller
{
    public function available(Request $request, TimeSlotService $timeSlotService): JsonResponse
    {
        $data = $request->validate([
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')->where('is_active', true)],
            'date' => ['required', 'date'],
        ]);

        $doctor = Doctor::query()
            ->whereKey($data['doctor_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $slots = $timeSlotService->getReservableSlotsForDoctorAndDate(
            $doctor,
            $data['date'],
            $request->user()->id,
            true,
        )
            ->filter(fn ($slot) => $timeSlotService->isSlotWithinClinicHours($slot))
            ->values()
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'status' => $slot->status,
            ]);

        return response()->json([
            'data' => $slots,
            'clinic_hours' => $timeSlotService->clinicHoursPayloadForDate($data['date']),
        ]);
    }

    public function lock(Request $request, TimeSlotService $timeSlotService): JsonResponse
    {
        $data = $request->validate([
            'slot_id' => ['required', 'integer', 'exists:time_slots,id'],
        ]);

        $slot = DB::transaction(function () use ($request, $data, $timeSlotService) {
            $slot = TimeSlot::query()->with('doctor')->lockForUpdate()->findOrFail($data['slot_id']);

            if (! $slot->doctor?->is_active) {
                abort(422, 'This doctor is not available for booking.');
            }

            if (! $slot->start_time->isFuture()) {
                abort(422, 'This slot is no longer available.');
            }

            if (! $timeSlotService->isSlotWithinClinicHours($slot)) {
                abort(422, 'Appointments are only available during clinic hours.');
            }

            if ($slot->status === 'booked') {
                abort(422, 'This slot has already been booked.');
            }

            if (
                $slot->status === 'locked'
                && $slot->locked_by_user_id !== $request->user()->id
                && $slot->locked_until?->isFuture()
            ) {
                abort(422, 'This slot is temporarily locked by another patient.');
            }

            $slot->update([
                'status' => 'locked',
                'locked_by_user_id' => $request->user()->id,
                'locked_until' => now()->addMinutes(15),
            ]);

            return $slot->fresh();
        });

        return response()->json([
            'message' => 'Slot locked for 15 minutes.',
            'data' => [
                'id' => $slot->id,
                'locked_until' => $slot->locked_until,
            ],
        ]);
    }
    public function unlock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slot_id' => ['required', 'integer', 'exists:time_slots,id'],
        ]);

        $slot = DB::transaction(function () use ($request, $data) {
            $slot = TimeSlot::query()->lockForUpdate()->findOrFail($data['slot_id']);

            if ($slot->status === 'locked' && $slot->locked_by_user_id === $request->user()->id) {
                $slot->update([
                    'status' => 'available',
                    'locked_by_user_id' => null,
                    'locked_until' => null,
                ]);
            }

            return $slot->fresh();
        });

        return response()->json([
            'message' => 'Slot unlocked.',
        ]);
    }
}
