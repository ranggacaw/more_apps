<?php

namespace App\Http\Controllers;

use App\Jobs\SendBookingNotificationJob;
use App\Models\Booking;
use App\Models\Consultation;
use App\Models\Package;
use App\Services\ClinicAssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DoctorDashboardController extends Controller
{
    public function __invoke(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $doctor = $request->user()->doctorProfile()->with(['user', 'availabilities'])->firstOrFail();

        $consultationWorkload = $doctor->bookings()
            ->with(['patient', 'slot', 'payment', 'consultation'])
            ->where('status', 'confirmed')
            ->whereHas('slot', fn ($query) => $query->where('start_time', '>=', now()->startOfDay()))
            ->get()
            ->sortBy(fn ($booking) => sprintf(
                '%d-%s',
                $booking->slot->start_time->isToday() ? 0 : 1,
                $booking->slot->start_time->format('YmdHis'),
            ))
            ->values();

        $packages = Package::query()
            ->where('is_active', true)
            ->orderBy('price')
            ->orderBy('name')
            ->get();

        return Inertia::render('Doctor/Dashboard', [
            'doctor' => [
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
                'bio' => $doctor->bio,
            ],
            'consultationWorkload' => $consultationWorkload->map(fn ($booking) => [
                'id' => $booking->id,
                'patient' => [
                    'name' => $booking->patient->name,
                    'email' => $booking->patient->email,
                    'phone' => $booking->patient->phone,
                ],
                'status' => $booking->status,
                'start_time' => $booking->slot->start_time,
                'payment_status' => $booking->payment?->status,
                'is_today' => $booking->slot->start_time->isToday(),
                'can_complete' => $booking->status === 'confirmed',
                'consultation' => $booking->consultation ? [
                    'notes' => $booking->consultation->notes,
                    'recommended_package_id' => $booking->consultation->recommended_package_id,
                ] : null,
                'intake' => [
                    'notes' => $booking->notes,
                    'patient_upload_name' => $booking->patient_upload_path ? basename($booking->patient_upload_path) : null,
                    'patient_upload_url' => $booking->patient_upload_path
                        ? $clinicAssetService->temporaryUrl($booking->patient_upload_path, now()->addMinutes(30))
                        : null,
                ],
            ]),
            'packages' => $packages->map(fn ($package) => [
                'id' => $package->id,
                'name' => $package->name,
                'price' => $package->price,
                'consultation_credits' => $package->consultation_credits,
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

        abort_unless($booking->doctor_id === $doctor->id && $booking->status === 'confirmed', 403);

        $data = $request->validate([
            'notes' => ['required', 'string', 'max:2000'],
            'recommended_package_id' => ['nullable', 'integer', Rule::exists('packages', 'id')->where('is_active', true)],
            'meal_plan_summary' => ['nullable', 'string', 'max:4000'],
        ]);

        DB::transaction(function () use ($booking, $doctor, $data, $clinicAssetService): void {
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            abort_unless($lockedBooking->doctor_id === $doctor->id && $lockedBooking->status === 'confirmed', 403);

            $consultation = Consultation::updateOrCreate(
                ['booking_id' => $lockedBooking->id],
                [
                    'user_id' => $lockedBooking->user_id,
                    'doctor_id' => $doctor->id,
                    'recommended_package_id' => $data['recommended_package_id'] ?? null,
                    'notes' => $data['notes'],
                    'completed_at' => now(),
                ],
            );

            if (filled($data['meal_plan_summary'] ?? null)) {
                $consultation->update([
                    'meal_plan_pdf_path' => $clinicAssetService->storeMealPlanPdf($consultation, $data['meal_plan_summary']),
                ]);
            }

            $lockedBooking->update(['status' => 'completed']);

            SendBookingNotificationJob::dispatch($lockedBooking, 'completion-follow-up');
        });

        return back()->with('success', 'Consultation completed and patient follow-up queued.');
    }
}
