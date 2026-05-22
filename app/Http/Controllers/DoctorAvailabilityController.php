<?php

namespace App\Http\Controllers;

use App\Models\DoctorAvailability;
use App\Services\TimeSlotService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorAvailabilityController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $doctor = $request->user()->doctorProfile()->with(['availabilities', 'slots' => fn ($query) => $query
            ->where('start_time', '>=', now())
            ->orderBy('start_time')
            ->take(42),
        ])->firstOrFail();

        return Inertia::render('Doctor/Availability', [
            'doctor' => [
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
            ],
            'availabilities' => $doctor->availabilities->map(fn ($availability) => [
                'id' => $availability->id,
                'day_of_week' => $availability->day_of_week,
                'start_time' => $availability->start_time,
                'end_time' => $availability->end_time,
                'slot_duration_minutes' => $availability->slot_duration_minutes,
            ]),
            'upcomingSlots' => $doctor->slots->map(fn ($slot) => [
                'id' => $slot->id,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'status' => $slot->status,
            ]),
        ]);
    }

    public function store(Request $request, TimeSlotService $timeSlotService): RedirectResponse
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        $data = $request->validate([
            'day_of_week' => ['required', 'integer', 'between:0,7'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'slot_duration_minutes' => ['required', 'integer', 'min:15', 'max:120'],
        ]);

        $days = $data['day_of_week'] === 7 ? range(0, 6) : [$data['day_of_week']];

        foreach ($days as $day) {
            $availability = DoctorAvailability::create([
                'doctor_id' => $doctor->id,
                'day_of_week' => $day,
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'slot_duration_minutes' => $data['slot_duration_minutes'],
                'is_active' => true,
            ]);

            $timeSlotService->generateUpcomingSlots($availability);
        }

        $message = $data['day_of_week'] === 7
            ? 'Availability saved for every day and slots generated.'
            : 'Availability saved and slots generated.';

        return back()->with('success', $message);
    }

    public function destroy(Request $request, DoctorAvailability $availability): RedirectResponse
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        abort_if($availability->doctor_id !== $doctor->id, 403);

        $availability->slots()
            ->where('start_time', '>=', now())
            ->whereIn('status', ['open', 'locked'])
            ->delete();

        $availability->delete();

        return back()->with('success', 'Availability block removed.');
    }
}
