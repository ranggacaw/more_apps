<?php

namespace App\Http\Controllers;

use App\Jobs\SendBookingNotificationJob;
use App\Models\AestheticProgram;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\ClinicOperatingHour;
use App\Models\Consultation;
use App\Models\ConsultationPackageOption;
use App\Models\Doctor;
use App\Models\Package;
use App\Models\Payment;
use App\Models\UserPackage;
use App\Services\ClinicAssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DoctorDashboardController extends Controller
{
    public function __invoke(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $doctor = $request->user()->doctorProfile()->with('user')->firstOrFail();
        $consultationWorkload = $this->consultationWorkload($doctor, $clinicAssetService);
        $activePrograms = $this->activePrograms($doctor, $clinicAssetService);
        $pendingReviews = $this->pendingReviewItems($activePrograms);
        $clinicSchedule = $this->clinicSchedule();

        return Inertia::render('Doctor/Dashboard', [
            'doctor' => $this->doctorPayload($doctor),
            'stats' => [
                'active_patients' => $activePrograms->count(),
                'ready_consultations' => $consultationWorkload->where('can_complete', true)->count(),
                'pending_reviews' => $pendingReviews->count(),
                'clinic_schedule_days' => $clinicSchedule->pluck('day_of_week')->unique()->count(),
            ],
            'todaySchedule' => $consultationWorkload->take(5)->values(),
            'nextConsultation' => $consultationWorkload->firstWhere('can_complete', true) ?? $consultationWorkload->first(),
            'pendingReviews' => $pendingReviews->take(5)->values(),
            'clinicSchedule' => $clinicSchedule,
        ]);
    }

    private function clinicSchedule(): Collection
    {
        return ClinicOperatingHour::query()
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->map(fn (ClinicOperatingHour $hour) => [
                'id' => $hour->id,
                'day_of_week' => $hour->day_of_week,
                'start_time' => substr((string) $hour->start_time, 0, 5),
                'end_time' => substr((string) $hour->end_time, 0, 5),
            ])
            ->values();
    }

    public function consultations(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $doctor = $request->user()->doctorProfile()->with('user')->firstOrFail();
        $consultationWorkload = $this->consultationWorkload($doctor, $clinicAssetService);

        return Inertia::render('Doctor/Consultations', [
            'doctor' => $this->doctorPayload($doctor),
            'stats' => [
                'total' => $consultationWorkload->count(),
                'today' => $consultationWorkload->where('is_today', true)->count(),
                'ready' => $consultationWorkload->where('can_complete', true)->count(),
            ],
            'bookings' => $consultationWorkload,
        ]);
    }

    public function showConsultation(Request $request, Booking $booking, ClinicAssetService $clinicAssetService): Response
    {
        $doctor = $request->user()->doctorProfile()->with('user')->firstOrFail();

        abort_unless($booking->doctor_id === $doctor->id && $booking->status === 'confirmed', 403);

        $booking->load(['patient', 'slot', 'payment', 'consultation.lineItems']);

        $packages = Package::query()
            ->where('is_active', true)
            ->orderBy('price')
            ->orderBy('name')
            ->get();

        $packageOptions = ConsultationPackageOption::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $aestheticPrograms = AestheticProgram::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $lastUsedPackageOptionId = $booking->user_id
            ? \App\Models\ConsultationLineItem::query()
                ->where('type', 'package_option')
                ->whereHas('consultation', fn ($query) => $query
                    ->where('user_id', $booking->user_id)
                    ->whereNotNull('completed_at'))
                ->latest('id')
                ->value('consultation_package_option_id')
            : null;

        return Inertia::render('Doctor/ConsultationWorkspace', [
            'doctor' => $this->doctorPayload($doctor),
            'booking' => $this->mapConsultationBooking($booking, $clinicAssetService),
            'packages' => $packages->map(fn (Package $package) => [
                'id' => $package->id,
                'name' => $package->name,
                'price' => $package->price,
                'consultation_credits' => $package->consultation_credits,
            ])->values(),
            'packageOptions' => $packageOptions->map(fn (ConsultationPackageOption $option) => [
                'id' => $option->id,
                'program_family' => $option->program_family,
                'option_type' => $option->option_type,
                'name' => $option->name,
                'price' => $option->price,
                'injection_frequency' => $option->injection_frequency,
                'duration_label' => $option->duration_label,
                'duration_days' => $option->duration_days,
                'requires_program_family' => $option->requires_program_family,
            ])->values(),
            'aestheticPrograms' => $aestheticPrograms->map(fn (AestheticProgram $program) => [
                'id' => $program->id,
                'name' => $program->name,
                'price' => $program->price,
            ])->values(),
            'lastUsedPackageOptionId' => $lastUsedPackageOptionId,
            'backHref' => route('doctor.consultations.index', [], false),
        ]);
    }

    public function programReviews(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $doctor = $request->user()->doctorProfile()->with('user')->firstOrFail();
        $activePrograms = $this->activePrograms($doctor, $clinicAssetService);
        $pendingReviews = $this->pendingReviewItems($activePrograms);

        return Inertia::render('Doctor/ProgramReviews', [
            'doctor' => $this->doctorPayload($doctor),
            'stats' => [
                'active_programs' => $activePrograms->count(),
                'active_patients' => $activePrograms->pluck('patient.email')->filter()->unique()->count(),
                'pending_reviews' => $pendingReviews->count(),
            ],
            'programs' => $activePrograms,
            'pendingReviews' => $pendingReviews,
        ]);
    }

    public function complete(Request $request, Booking $booking, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        abort_unless($booking->doctor_id === $doctor->id && $booking->status === 'confirmed', 403);

        if ($booking->isAdminAssisted() && $booking->consultation_mode === 'online' && blank($booking->meeting_link)) {
            return redirect()->route('doctor.consultations.show', $booking)->with('error', 'A Google Meet link is required before completing this online consultation.');
        }

        $data = $request->validate([
            'notes' => ['required', 'string', 'max:2000'],
            'recommended_package_id' => ['nullable', 'integer', Rule::exists('packages', 'id')->where('is_active', true)],
            'meal_plan_summary' => ['nullable', 'string', 'max:4000'],
            'package_option_id' => ['nullable', 'integer', Rule::exists('consultation_package_options', 'id')->where('is_active', true)->where('option_type', 'primary')],
            'diamond_oral_addon' => ['boolean'],
            'package_dosage_value' => ['nullable', 'numeric', 'min:0'],
            'package_dosage_unit' => ['nullable', 'string', 'max:20'],
            'package_notes' => ['nullable', 'string', 'max:1000'],
            'aesthetic_program_lines' => ['nullable', 'array'],
            'aesthetic_program_lines.*.aesthetic_program_id' => ['required', 'integer', Rule::exists('aesthetic_programs', 'id')->where('is_active', true)],
            'aesthetic_program_lines.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'aesthetic_program_lines.*.dosage_value' => ['nullable', 'numeric', 'min:0'],
            'aesthetic_program_lines.*.dosage_unit' => ['nullable', 'string', 'max:20'],
            'aesthetic_program_lines.*.notes' => ['nullable', 'string', 'max:1000'],
            'manual_treatment_lines' => ['nullable', 'array'],
            'manual_treatment_lines.*.name' => ['required', 'string', 'max:255'],
            'manual_treatment_lines.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'manual_treatment_lines.*.unit_price' => ['nullable', 'integer', 'min:0'],
            'manual_treatment_lines.*.dosage_value' => ['nullable', 'numeric', 'min:0'],
            'manual_treatment_lines.*.dosage_unit' => ['nullable', 'string', 'max:20'],
            'manual_treatment_lines.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (($data['diamond_oral_addon'] ?? false) && blank($data['package_option_id'] ?? null)) {
            return back()->withErrors(['diamond_oral_addon' => 'Diamond oral medication requires a Diamond primary option.'])->withInput();
        }

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

            $lineItems = $this->buildConsultationLineItems($consultation, $doctor, $data);
            $consultation->lineItems()->delete();

            foreach ($lineItems as $lineItem) {
                $consultation->lineItems()->create($lineItem);
            }

            $chargeableItems = collect($lineItems)->filter(fn (array $item) => $item['line_total'] > 0)->values();

            if ($chargeableItems->isNotEmpty()) {
                Payment::create([
                    'user_id' => $lockedBooking->user_id,
                    'booking_id' => $lockedBooking->id,
                    'consultation_id' => $consultation->id,
                    'attempt_number' => ((int) $lockedBooking->payments()->max('attempt_number')) + 1,
                    'type' => 'consultation_treatment',
                    'amount' => (int) $chargeableItems->sum('line_total'),
                    'hpp_amount' => (int) $chargeableItems->sum(fn (array $item) => $item['hpp_amount'] * $item['quantity']),
                    'provider' => 'internal',
                    'midtrans_order_id' => sprintf('TREAT-%d-%d-%s', $lockedBooking->id, $consultation->id, Str::upper(Str::random(6))),
                    'status' => 'pending',
                    'payload' => [
                        'source' => 'consultation_completion',
                        'line_items' => $chargeableItems->map(fn (array $item) => [
                            'type' => $item['type'],
                            'name' => $item['name'],
                            'quantity' => $item['quantity'],
                            'dosage_value' => $item['dosage_value'],
                            'dosage_unit' => $item['dosage_unit'],
                            'unit_price' => $item['unit_price'],
                            'hpp_amount' => $item['hpp_amount'],
                            'line_total' => $item['line_total'],
                            'metadata' => $item['metadata'],
                        ])->all(),
                    ],
                ]);
            }

            $lockedBooking->update(['status' => 'completed']);

            SendBookingNotificationJob::dispatch($lockedBooking, 'completion-follow-up');
        });

        return redirect()->route('doctor.consultations.index')->with('success', 'Consultation completed and patient follow-up queued.');
    }

    public function saveMeetingLink(Request $request, Booking $booking): RedirectResponse
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        abort_unless($booking->doctor_id === $doctor->id && $booking->status === 'confirmed', 403);
        abort_unless($booking->isAdminAssisted() && $booking->consultation_mode === 'online', 422, 'This booking does not require a doctor-supplied meeting link.');

        $data = $request->validate([
            'meeting_link' => ['required', 'string', 'url', 'max:500', function ($attribute, $value, $fail) {
                $host = parse_url($value, PHP_URL_HOST);
                if (! $host || ! str_ends_with($host, 'meet.google.com')) {
                    $fail('The meeting link must be a valid Google Meet URL (https://meet.google.com/...).');
                }
            }],
        ]);

        DB::transaction(function () use ($booking, $doctor, $data): void {
            $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            abort_unless($lockedBooking->doctor_id === $doctor->id && $lockedBooking->status === 'confirmed', 403);

            $lockedBooking->update([
                'meeting_link' => $data['meeting_link'],
                'meeting_link_submitted_at' => now(),
            ]);

            SendBookingNotificationJob::dispatch($lockedBooking->fresh(), 'meeting-link-ready');
        });

        return redirect()->route('doctor.consultations.show', $booking)->with('success', 'Google Meet link saved. The patient has been notified.');
    }

    private function consultationWorkload(Doctor $doctor, ClinicAssetService $clinicAssetService): Collection
    {
        return $doctor->bookings()
            ->with(['patient', 'slot', 'payment', 'consultation'])
            ->where('status', 'confirmed')
            ->whereHas('slot', fn ($query) => $query->where('start_time', '>=', now()->startOfDay()))
            ->get()
            ->sortBy(fn ($booking) => sprintf(
                '%d-%s',
                $booking->slot->start_time->isToday() ? 0 : 1,
                $booking->slot->start_time->format('YmdHis'),
            ))
            ->map(fn (Booking $booking) => $this->mapConsultationBooking($booking, $clinicAssetService))
            ->values();
    }

    private function pendingReviewItems(Collection $activePrograms): Collection
    {
        return $activePrograms
            ->flatMap(function (array $program) {
                return collect($program['progress_history'])
                    ->filter(fn (array $checkIn) => $checkIn['reviewed_at'] === null)
                    ->map(fn (array $checkIn) => [
                        'id' => $checkIn['id'],
                        'patient' => $program['patient'],
                        'package_name' => $program['package']['name'],
                        'program_week' => $checkIn['program_week'],
                        'checked_in_at' => $checkIn['checked_in_at'],
                        'review_href' => $checkIn['record_href'],
                    ]);
            })
            ->sortByDesc(fn (array $item) => $item['checked_in_at'] ?? '')
            ->values();
    }

    private function activePrograms(Doctor $doctor, ClinicAssetService $clinicAssetService): Collection
    {
        return UserPackage::query()
            ->active()
            ->whereHas('sourceConsultation', fn ($query) => $query->where('doctor_id', $doctor->id)->whereNotNull('completed_at'))
            ->with([
                'user',
                'package',
                'sourceConsultation.doctor.user',
                'progressCheckIns.doctor.user',
            ])
            ->get()
            ->sort(function (UserPackage $left, UserPackage $right): int {
                $leftPending = $this->hasPendingReview($left);
                $rightPending = $this->hasPendingReview($right);

                if ($leftPending !== $rightPending) {
                    return $leftPending ? -1 : 1;
                }

                return $this->latestProgressTimestamp($right) <=> $this->latestProgressTimestamp($left);
            })
            ->map(fn (UserPackage $userPackage) => $this->mapActiveProgram($userPackage, $clinicAssetService))
            ->values();
    }

    private function doctorPayload(Doctor $doctor): array
    {
        return [
            'name' => $doctor->user->name,
            'specialization' => $doctor->specialization,
            'bio' => $doctor->bio,
        ];
    }

    private function mapConsultationBooking(Booking $booking, ClinicAssetService $clinicAssetService): array
    {
        $isGuest = $booking->isGuestBooking();
        $patientName = $booking->patientDisplayName();
        $patientEmail = $booking->patientContactEmail();
        $patientPhone = $booking->patientContactPhone();

        return [
            'id' => $booking->id,
            'patient' => [
                'name' => $patientName,
                'email' => $patientEmail ?? '',
                'phone' => $patientPhone ?? '',
            ],
            'status' => $booking->status,
            'start_time' => $booking->slot->start_time,
            'meeting_link' => $booking->meeting_link,
            'payment_status' => $booking->payment?->status,
            'is_today' => $booking->slot->start_time->isToday(),
            'can_complete' => $booking->status === 'confirmed' && ! $booking->needsMeetingLink(),
            'is_admin_assisted' => $booking->isAdminAssisted(),
            'is_guest' => $isGuest,
            'consultation_mode' => $booking->consultation_mode,
            'needs_meeting_link' => $booking->needsMeetingLink(),
            'consultation' => $booking->consultation ? [
                'notes' => $booking->consultation->notes,
                'recommended_package_id' => $booking->consultation->recommended_package_id,
                'line_items' => $booking->consultation->lineItems->map(fn ($lineItem) => [
                    'id' => $lineItem->id,
                    'type' => $lineItem->type,
                    'name' => $lineItem->name,
                    'quantity' => $lineItem->quantity,
                    'dosage_value' => $lineItem->dosage_value,
                    'dosage_unit' => $lineItem->dosage_unit,
                    'unit_price' => $lineItem->unit_price,
                    'line_total' => $lineItem->line_total,
                    'notes' => $lineItem->notes,
                    'aesthetic_program_id' => $lineItem->aesthetic_program_id,
                    'consultation_package_option_id' => $lineItem->consultation_package_option_id,
                    'metadata' => $lineItem->metadata,
                ])->values(),
            ] : null,
            'intake' => [
                'notes' => $booking->notes,
                'patient_upload_name' => $booking->patient_upload_path ? basename($booking->patient_upload_path) : null,
                'patient_upload_url' => $clinicAssetService->temporaryAssetUrl($booking->patient_upload_path, now()->addMinutes(30)),
            ],
            'workspace_href' => route('doctor.consultations.show', $booking, false),
        ];
    }

    private function hasPendingReview(UserPackage $userPackage): bool
    {
        $latestCheckIn = $userPackage->progressCheckIns->sortByDesc('program_week')->first();

        return $latestCheckIn !== null && $latestCheckIn->reviewed_at === null;
    }

    private function latestProgressTimestamp(UserPackage $userPackage): int
    {
        return (int) ($userPackage->progressCheckIns->sortByDesc('checked_in_at')->first()?->checked_in_at?->timestamp ?? 0);
    }

    private function mapActiveProgram(UserPackage $userPackage, ClinicAssetService $clinicAssetService): array
    {
        $mealPlanPath = $userPackage->sourceConsultation?->meal_plan_pdf_path;
        $progressHistory = $userPackage->progressCheckIns->sortByDesc('program_week')->values();
        $latestCheckIn = $progressHistory->first();
        $pendingReview = $progressHistory->first(fn (CheckIn $checkIn) => $checkIn->reviewed_at === null);
        $reviewTarget = $pendingReview ?? $latestCheckIn;

        return [
            'id' => $userPackage->id,
            'patient' => [
                'name' => $userPackage->user->name,
                'email' => $userPackage->user->email,
                'phone' => $userPackage->user->phone,
            ],
            'package' => [
                'name' => $userPackage->package->name,
                'status' => $userPackage->status,
                'consultation_credits_remaining' => $userPackage->consultation_credits_remaining,
                'consultation_credits_total' => $userPackage->consultation_credits_total,
                'activated_at' => $userPackage->activated_at?->toIso8601String(),
                'expires_at' => $userPackage->expires_at?->toIso8601String(),
            ],
            'meal_plan' => $mealPlanPath ? [
                'name' => basename($mealPlanPath),
                'url' => $clinicAssetService->temporaryAssetUrl($mealPlanPath, now()->addMinutes(30)),
            ] : null,
            'latest_check_in' => $latestCheckIn ? $this->mapProgramCheckIn($latestCheckIn, $clinicAssetService) : null,
            'has_pending_review' => $latestCheckIn !== null && $latestCheckIn->reviewed_at === null,
            'pending_review_count' => $progressHistory->filter(fn (CheckIn $checkIn) => $checkIn->reviewed_at === null)->count(),
            'review_workspace_href' => $reviewTarget
                ? route('doctor.medical-records.show', ['recordType' => 'progress', 'recordId' => $reviewTarget->id], false)
                : null,
            'progress_history' => $progressHistory
                ->map(fn (CheckIn $checkIn) => $this->mapProgramCheckIn($checkIn, $clinicAssetService))
                ->values()
                ->all(),
        ];
    }

    private function mapProgramCheckIn(CheckIn $checkIn, ClinicAssetService $clinicAssetService): array
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
                'url' => $clinicAssetService->temporaryAssetUrl($checkIn->progress_photo_path, now()->addMinutes(30)),
            ] : null,
            'review_notes' => $checkIn->review_notes,
            'reviewed_at' => $checkIn->reviewed_at?->toIso8601String(),
            'reviewed_by' => $checkIn->doctor?->user?->name,
            'record_href' => route('doctor.medical-records.show', ['recordType' => 'progress', 'recordId' => $checkIn->id], false),
        ];
    }

    public function queueStatus(Request $request)
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        $currentQueueEntry = \App\Models\ClinicQueueEntry::where('doctor_id', $doctor->id)
            ->whereIn('status', ['assigned', 'in_consultation'])
            ->orderBy('id', 'asc')
            ->first();

        return response()->json($currentQueueEntry ? [
            'id' => $currentQueueEntry->id,
            'queue_number' => $currentQueueEntry->queue_number,
            'patient_name' => $currentQueueEntry->patient_name,
            'patient_phone' => $currentQueueEntry->patient_phone,
            'complaint_notes' => $currentQueueEntry->complaint_notes,
            'status' => $currentQueueEntry->status,
            'assigned_at' => $currentQueueEntry->assigned_at?->toIso8601String(),
            'consultation_started_at' => $currentQueueEntry->consultation_started_at?->toIso8601String(),
        ] : null);
    }

    public function startQueueConsultation(Request $request, \App\Models\ClinicQueueEntry $entry)
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        abort_unless($entry->doctor_id === $doctor->id && $entry->status === 'assigned', 403);

        $entry->update([
            'status' => 'in_consultation',
            'consultation_started_at' => now(),
        ]);

        return back()->with('success', 'Walk-in consultation started.');
    }

    public function completeQueueConsultation(Request $request, \App\Models\ClinicQueueEntry $entry)
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        abort_unless($entry->doctor_id === $doctor->id && $entry->status === 'in_consultation', 403);

        $entry->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Walk-in consultation completed.');
    }

    private function buildConsultationLineItems(Consultation $consultation, Doctor $doctor, array $data): array
    {
        $lineItems = [];
        $packageOption = null;

        if (filled($data['package_option_id'] ?? null)) {
            $packageOption = ConsultationPackageOption::query()
                ->whereKey($data['package_option_id'])
                ->where('is_active', true)
                ->where('option_type', 'primary')
                ->firstOrFail();

            $lineItems[] = [
                'doctor_id' => $doctor->id,
                'consultation_package_option_id' => $packageOption->id,
                'type' => 'package_option',
                'name' => $packageOption->name,
                'quantity' => 1,
                'dosage_value' => $data['package_dosage_value'] ?? null,
                'dosage_unit' => ($data['package_dosage_unit'] ?? null) ?: 'ml',
                'unit_price' => $packageOption->price,
                'hpp_amount' => 0,
                'line_total' => $packageOption->price,
                'notes' => $data['package_notes'] ?? null,
                'metadata' => [
                    'program_family' => $packageOption->program_family,
                    'injection_frequency' => $packageOption->injection_frequency,
                    'duration_label' => $packageOption->duration_label,
                    'duration_days' => $packageOption->duration_days,
                ],
            ];
        }

        if ($data['diamond_oral_addon'] ?? false) {
            abort_unless($packageOption?->program_family === 'diamond', 422, 'Diamond oral medication requires a Diamond primary option.');

            $addon = ConsultationPackageOption::query()
                ->where('is_active', true)
                ->where('option_type', 'addon')
                ->where('requires_program_family', 'diamond')
                ->orderBy('sort_order')
                ->firstOrFail();

            $lineItems[] = [
                'doctor_id' => $doctor->id,
                'consultation_package_option_id' => $addon->id,
                'type' => 'package_addon',
                'name' => $addon->name,
                'quantity' => 1,
                'dosage_value' => null,
                'dosage_unit' => 'ml',
                'unit_price' => $addon->price,
                'hpp_amount' => 0,
                'line_total' => $addon->price,
                'notes' => null,
                'metadata' => [
                    'program_family' => $addon->program_family,
                    'duration_label' => $addon->duration_label,
                    'duration_days' => $addon->duration_days,
                    'requires_program_family' => $addon->requires_program_family,
                ],
            ];
        }

        foreach ($data['aesthetic_program_lines'] ?? [] as $line) {
            $program = AestheticProgram::query()
                ->whereKey($line['aesthetic_program_id'])
                ->where('is_active', true)
                ->firstOrFail();
            $quantity = (int) $line['quantity'];

            $lineItems[] = [
                'doctor_id' => $doctor->id,
                'aesthetic_program_id' => $program->id,
                'type' => 'aesthetic_program',
                'name' => $program->name,
                'quantity' => $quantity,
                'dosage_value' => $line['dosage_value'] ?? null,
                'dosage_unit' => ($line['dosage_unit'] ?? null) ?: 'ml',
                'unit_price' => $program->price,
                'hpp_amount' => $program->hpp_amount,
                'line_total' => $program->price * $quantity,
                'notes' => $line['notes'] ?? null,
                'metadata' => ['aesthetic_program_id' => $program->id],
            ];
        }

        foreach ($data['manual_treatment_lines'] ?? [] as $line) {
            $quantity = (int) $line['quantity'];
            $unitPrice = (int) ($line['unit_price'] ?? 0);

            $lineItems[] = [
                'doctor_id' => $doctor->id,
                'type' => 'manual_treatment',
                'name' => $line['name'],
                'quantity' => $quantity,
                'dosage_value' => $line['dosage_value'] ?? null,
                'dosage_unit' => ($line['dosage_unit'] ?? null) ?: 'ml',
                'unit_price' => $unitPrice,
                'hpp_amount' => 0,
                'line_total' => $unitPrice * $quantity,
                'notes' => $line['notes'] ?? null,
                'metadata' => ['source' => 'manual'],
            ];
        }

        return $lineItems;
    }
}
