<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Services\TimeSlotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SlotController extends Controller
{
    public function available(Request $request, TimeSlotService $timeSlotService): JsonResponse
    {
        $data = $request->validate([
            'doctor_id' => ['required', 'integer', 'exists:doctors,id'],
            'date' => ['required', 'date'],
        ]);

        $timeSlotService->generateForDoctorAndDate(
            Doctor::findOrFail($data['doctor_id']),
            $data['date'],
        );

        $slots = TimeSlot::query()
            ->where('doctor_id', $data['doctor_id'])
            ->whereDate('start_time', $data['date'])
            ->where(function ($query): void {
                $query->where('status', 'available')
                    ->orWhere(function ($lockedQuery): void {
                        $lockedQuery->where('status', 'locked')
                            ->where('locked_until', '<=', now());
                    });
            })
            ->orderBy('start_time')
            ->get()
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'status' => $slot->status,
            ]);

        return response()->json(['data' => $slots]);
    }

    public function lock(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slot_id' => ['required', 'integer', 'exists:time_slots,id'],
        ]);

        $slot = DB::transaction(function () use ($request, $data) {
            $slot = TimeSlot::query()->lockForUpdate()->findOrFail($data['slot_id']);

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
}
