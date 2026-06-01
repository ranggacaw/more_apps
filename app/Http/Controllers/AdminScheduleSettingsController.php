<?php

namespace App\Http\Controllers;

use App\Models\ClinicOperatingHour;
use App\Models\ScheduleOverrideLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminScheduleSettingsController extends Controller
{
    public function index(): Response
    {
        $hours = ClinicOperatingHour::query()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        $overrides = ScheduleOverrideLog::query()
            ->with(['admin', 'doctor.user', 'booking'])
            ->latest()
            ->take(30)
            ->get();

        return Inertia::render('Admin/ScheduleSettings', [
            'hours' => $hours->map(fn (ClinicOperatingHour $hour) => [
                'id' => $hour->id,
                'day_of_week' => $hour->day_of_week,
                'start_time' => substr((string) $hour->start_time, 0, 5),
                'end_time' => substr((string) $hour->end_time, 0, 5),
                'is_active' => $hour->is_active,
            ])->values(),
            'overrides' => $overrides->map(fn (ScheduleOverrideLog $override) => [
                'id' => $override->id,
                'admin' => $override->admin?->name,
                'doctor' => $override->doctor?->user?->name,
                'booking_id' => $override->booking_id,
                'override_date' => $override->override_date?->toDateString(),
                'start_time' => substr((string) $override->start_time, 0, 5),
                'end_time' => $override->end_time ? substr((string) $override->end_time, 0, 5) : null,
                'reason' => $override->reason,
                'created_at' => $override->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        ClinicOperatingHour::create($this->validateHour($request));

        return back()->with('success', 'Clinic hours saved.');
    }

    public function update(Request $request, ClinicOperatingHour $clinicHour): RedirectResponse
    {
        $clinicHour->update($this->validateHour($request));

        return back()->with('success', 'Clinic hours updated.');
    }

    private function validateHour(Request $request): array
    {
        $data = $request->validate([
            'day_of_week' => ['required', 'integer', 'between:0,6'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'is_active' => ['required', 'boolean'],
        ]);

        $data['start_time'] .= ':00';
        $data['end_time'] .= ':00';

        return $data;
    }
}
