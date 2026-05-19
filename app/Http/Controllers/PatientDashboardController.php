<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\UserPackage;
use App\Services\ClinicAssetService;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientDashboardController extends Controller
{
    public function __invoke(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $user = $request->user();

        $bookings = $user->bookings()
            ->with(['doctor.user', 'slot', 'payment'])
            ->latest()
            ->take(6)
            ->get();

        $upcomingConsultation = $user->bookings()
            ->with(['doctor.user', 'slot'])
            ->where('status', 'confirmed')
            ->whereHas('slot', fn ($query) => $query->where('start_time', '>=', now()))
            ->get()
            ->sortBy(fn (Booking $booking) => $booking->slot->start_time->timestamp)
            ->first();

        $activePackages = $user->userPackages()
            ->active()
            ->with([
                'package',
                'sourceConsultation.doctor.user',
                'progressCheckIns.doctor.user',
            ])
            ->orderByDesc('activated_at')
            ->get();

        $mappedPackages = $activePackages
            ->map(fn (UserPackage $userPackage) => $this->mapActivePackage($userPackage, $clinicAssetService))
            ->values();

        return Inertia::render('Patient/Dashboard', [
            'stats' => [
                'totalBookings' => $user->bookings()->count(),
                'confirmedBookings' => $user->bookings()->where('status', 'confirmed')->count(),
                'paidBookings' => $user->payments()->where('status', 'paid')->count(),
                'activePackages' => $mappedPackages->count(),
            ],
            'profileContext' => [
                'name' => $user->name,
                'phone' => $user->phone,
                'date_of_birth' => $user->date_of_birth?->toDateString(),
                'address' => $user->address,
                'medical_notes' => $user->medical_notes,
            ],
            'upcomingConsultation' => $upcomingConsultation ? [
                'id' => $upcomingConsultation->id,
                'doctor' => $upcomingConsultation->doctor->user->name,
                'specialization' => $upcomingConsultation->doctor->specialization,
                'start_time' => $upcomingConsultation->slot->start_time,
            ] : null,
            'activePackages' => $mappedPackages,
            'engagementFeed' => $this->buildEngagementFeed($mappedPackages, $upcomingConsultation),
            'bookings' => $bookings->map(fn ($booking) => [
                'id' => $booking->id,
                'status' => $booking->status,
                'doctor' => $booking->doctor->user->name,
                'specialization' => $booking->doctor->specialization,
                'start_time' => $booking->slot->start_time,
                'meeting_link' => $booking->meeting_link,
                'payment_status' => $booking->payment?->status,
            ]),
        ]);
    }

    private function buildEngagementFeed(Collection $activePackages, ?Booking $upcomingConsultation): array
    {
        $items = [];

        if ($upcomingConsultation) {
            $items[] = [
                'variant' => 'success',
                'title' => 'Upcoming confirmed consultation',
                'body' => sprintf(
                    'Your next confirmed session with %s starts on %s.',
                    $upcomingConsultation->doctor->user->name,
                    $upcomingConsultation->slot->start_time->format('D, d M Y H:i'),
                ),
            ];
        }

        foreach ($activePackages as $userPackage) {
            if (! $userPackage['current_week_submitted']) {
                $items[] = [
                    'variant' => 'warning',
                    'title' => sprintf('%s week %d check-in is due', $userPackage['name'], $userPackage['current_program_week']),
                    'body' => 'Submit your latest weight and waist progress so your doctor can review the program on time.',
                ];
            }

            if ($userPackage['meal_plan']) {
                $items[] = [
                    'variant' => 'neutral',
                    'title' => sprintf('%s meal plan is ready', $userPackage['name']),
                    'body' => 'Open the current meal plan from your active package card whenever you need it.',
                ];
            }

            if ($userPackage['latest_review']) {
                $items[] = [
                    'variant' => 'success',
                    'title' => sprintf('Doctor review posted for %s', $userPackage['name']),
                    'body' => sprintf('Week %d now includes doctor follow-up notes in your progress history.', $userPackage['latest_review']['program_week']),
                ];
            }
        }

        return $items;
    }

    private function mapActivePackage(UserPackage $userPackage, ClinicAssetService $clinicAssetService): array
    {
        $progressHistory = $userPackage->progressCheckIns->values();
        $currentProgramWeek = $userPackage->currentProgramWeek();
        $currentWeekCheckIn = $progressHistory->firstWhere('program_week', $currentProgramWeek);
        $latestReview = $progressHistory
            ->filter(fn (CheckIn $checkIn) => $checkIn->reviewed_at !== null)
            ->sortByDesc(fn (CheckIn $checkIn) => $checkIn->reviewed_at?->timestamp ?? 0)
            ->first();
        $mealPlanPath = $userPackage->sourceConsultation?->meal_plan_pdf_path;

        return [
            'id' => $userPackage->id,
            'name' => $userPackage->package->name,
            'status' => $userPackage->status,
            'consultation_credits_total' => $userPackage->consultation_credits_total,
            'consultation_credits_remaining' => $userPackage->consultation_credits_remaining,
            'activated_at' => $userPackage->activated_at?->toIso8601String(),
            'expires_at' => $userPackage->expires_at?->toIso8601String(),
            'current_program_week' => $currentProgramWeek,
            'current_week_submitted' => $currentWeekCheckIn !== null,
            'doctor' => $userPackage->sourceConsultation?->doctor ? [
                'name' => $userPackage->sourceConsultation->doctor->user->name,
                'specialization' => $userPackage->sourceConsultation->doctor->specialization,
            ] : null,
            'meal_plan' => $mealPlanPath ? [
                'name' => basename($mealPlanPath),
                'url' => $clinicAssetService->temporaryUrl($mealPlanPath, now()->addMinutes(30)),
            ] : null,
            'latest_review' => $latestReview ? $this->mapProgressCheckIn($latestReview, $clinicAssetService) : null,
            'progress_history' => $progressHistory
                ->map(fn (CheckIn $checkIn) => $this->mapProgressCheckIn($checkIn, $clinicAssetService))
                ->values()
                ->all(),
        ];
    }

    private function mapProgressCheckIn(CheckIn $checkIn, ClinicAssetService $clinicAssetService): array
    {
        return [
            'id' => $checkIn->id,
            'program_week' => $checkIn->program_week,
            'weight_kg' => $checkIn->weight_kg,
            'waist_cm' => $checkIn->waist_cm,
            'notes' => $checkIn->notes,
            'checked_in_at' => $checkIn->checked_in_at?->toIso8601String(),
            'progress_photo' => $checkIn->progress_photo_path ? [
                'name' => basename($checkIn->progress_photo_path),
                'url' => $clinicAssetService->temporaryUrl($checkIn->progress_photo_path, now()->addMinutes(30)),
            ] : null,
            'review_notes' => $checkIn->review_notes,
            'reviewed_at' => $checkIn->reviewed_at?->toIso8601String(),
            'reviewed_by' => $checkIn->doctor?->user?->name,
        ];
    }
}
