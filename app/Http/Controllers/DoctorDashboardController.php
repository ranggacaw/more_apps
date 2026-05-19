<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Consultation;
use App\Services\ClinicAssetService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DoctorDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $doctor = $request->user()->doctorProfile()->with('availabilities')->firstOrFail();

        $upcomingBookings = $doctor->bookings()
            ->with(['patient', 'slot', 'payment'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereHas('slot', fn ($query) => $query->where('start_time', '>=', now()))
            ->get()
            ->sortBy(fn ($booking) => $booking->slot->start_time)
            ->values();

        return Inertia::render('Doctor/Dashboard', [
            'doctor' => [
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
                'bio' => $doctor->bio,
            ],
            'upcomingBookings' => $upcomingBookings->map(fn ($booking) => [
                'id' => $booking->id,
                'patient' => $booking->patient->name,
                'status' => $booking->status,
                'start_time' => $booking->slot->start_time,
                'payment_status' => $booking->payment?->status,
            ]),
            'availabilities' => $doctor->availabilities->map(fn ($availability) => [
                'id' => $availability->id,
                'day_of_week' => $availability->day_of_week,
                'start_time' => $availability->start_time,
                'end_time' => $availability->end_time,
                'slot_duration_minutes' => $availability->slot_duration_minutes,
            ]),
        ]);
    }

    public function complete(Request $request, Booking $booking, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        abort_unless($booking->doctor_id === $doctor->id, 403);

        $data = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
            'recommended_package_id' => ['nullable', 'integer', 'exists:packages,id'],
            'meal_plan_summary' => ['nullable', 'string', 'max:4000'],
        ]);

        if ($booking->status === 'confirmed') {
            DB::transaction(function () use ($booking, $doctor, $data, $clinicAssetService): void {
                $consultation = Consultation::updateOrCreate(
                    ['booking_id' => $booking->id],
                    [
                        'user_id' => $booking->user_id,
                        'doctor_id' => $doctor->id,
                        'recommended_package_id' => $data['recommended_package_id'] ?? null,
                        'notes' => $data['notes'] ?? null,
                        'completed_at' => now(),
                    ],
                );

                if (filled($data['meal_plan_summary'] ?? null)) {
                    $consultation->update([
                        'meal_plan_pdf_path' => $clinicAssetService->storeMealPlanPdf($consultation, $data['meal_plan_summary']),
                    ]);
                }

                $booking->update(['status' => 'completed']);
            });
        }

        return back()->with('success', 'Booking marked as completed.');
    }
}
