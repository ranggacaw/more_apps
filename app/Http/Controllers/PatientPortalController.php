<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\Consultation;
use App\Models\TimeSlot;
use App\Models\UserPackage;
use App\Services\ClinicAssetService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PatientPortalController extends Controller
{
    public function dashboard(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $patient = $request->user();
        $activePackages = $this->activePackages($patient->id);
        $latestReport = $this->finalizedReports($patient->id)->first();

        return Inertia::render('Patient/Dashboard', [
            'stats' => [
                'activePackages' => $activePackages->count(),
                'finalizedReports' => $this->finalizedReports($patient->id)->count(),
            ],
            'profileContext' => [
                'medical_notes' => $patient->medical_notes,
                'date_of_birth' => $patient->date_of_birth?->toDateString(),
                'address' => $patient->address,
            ],
            'activePackages' => $activePackages->map(fn (UserPackage $userPackage) => $this->mapPackage($userPackage, $clinicAssetService))->values(),
            'engagementFeed' => $this->engagementFeed($patient->id),
            'latestReport' => $latestReport ? $this->mapReportSummary($latestReport, $clinicAssetService) : null,
            'nextControlDate' => $latestReport?->next_control_date?->toDateString(),
            'metricSummary' => $this->metricSummary($patient->id),
        ]);
    }

    public function reports(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $reports = $this->finalizedReports($request->user()->id)->get();

        return Inertia::render('Patient/Reports', [
            'reports' => $reports->map(fn (Consultation $consultation) => $this->mapReportSummary($consultation, $clinicAssetService))->values(),
        ]);
    }

    public function showReport(Request $request, Consultation $consultation, ClinicAssetService $clinicAssetService): Response
    {
        abort_unless(
            $consultation->user_id === $request->user()->id
            && $consultation->patient_report_status === 'finalized'
            && $consultation->patient_report_finalized_at !== null,
            404,
        );

        $consultation->load(['doctor.user', 'recommendedPackage', 'userPackage.package']);

        return Inertia::render('Patient/ReportDetail', [
            'report' => [
                ...$this->mapReportSummary($consultation, $clinicAssetService),
                'notes' => $consultation->notes,
                'patient_instructions' => $consultation->patient_instructions,
                'metrics' => $this->mapMetrics($consultation),
                'metricComparisons' => $this->metricComparisons($consultation),
            ],
        ]);
    }

    public function progress(Request $request): Response
    {
        return Inertia::render('Patient/Progress', [
            'metrics' => $this->progressMetrics($request->user()->id),
        ]);
    }

    public function storeCheckIn(Request $request, UserPackage $userPackage, ClinicAssetService $clinicAssetService)
    {
        abort_unless($userPackage->user_id === $request->user()->id, 403);

        if ($userPackage->status !== 'active') {
            abort(422, 'Weekly check-ins require an active package.');
        }

        $programWeek = $userPackage->currentProgramWeek();

        if ($userPackage->checkIns()->progress()->where('program_week', $programWeek)->exists()) {
            abort(422, 'A check-in has already been submitted for this program week.');
        }

        $data = $request->validate([
            'weight_kg' => ['nullable', 'numeric', 'min:0'],
            'waist_cm' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'progress_photo' => ['nullable', 'file', 'image', 'max:5120'],
        ]);

        $checkIn = CheckIn::create([
            'user_package_id' => $userPackage->id,
            'consultation_id' => $userPackage->sourceConsultation?->id,
            'user_id' => $request->user()->id,
            'program_week' => $programWeek,
            'weight_kg' => $data['weight_kg'] ?? null,
            'waist_cm' => $data['waist_cm'] ?? null,
            'notes' => $data['notes'] ?? null,
            'checked_in_at' => now(),
        ]);

        if ($request->hasFile('progress_photo')) {
            $checkIn->update([
                'progress_photo_path' => $clinicAssetService->storeProgressPhoto($checkIn, $request->file('progress_photo')),
            ]);
        }

        return redirect()->route('patient.dashboard')->with('success', 'Weekly check-in submitted.');
    }

    public function medicalRecords(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $filters = $this->validatedRecordFilters($request);
        $currentPage = max($request->integer('page', 1), 1);
        $records = $this->recordsForPatient($request->user()->id, $clinicAssetService)
            ->filter(fn (array $record) => $this->matchesRecordFilters($record, $filters))
            ->sortByDesc('event_timestamp')
            ->values();
        $paginated = $this->paginateRecords(
            $records->map(fn (array $record) => $this->mapPatientIndexRecord($record, $filters, $currentPage))->values(),
            $currentPage,
            10,
        );

        return Inertia::render('Patient/MedicalRecords', [
            'filters' => $filters,
            'stats' => [
                'total_records' => $records->count(),
                'consultation_records' => $records->where('category', 'consultation')->count(),
                'progress_records' => $records->where('category', 'progress')->count(),
                'attachment_count' => $records->sum(fn (array $record) => count($record['attachments'])),
            ],
            'records' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'has_pages' => $paginated->hasPages(),
            ],
        ]);
    }

    public function showMedicalRecord(Request $request, string $recordType, int $recordId, ClinicAssetService $clinicAssetService): Response
    {
        $filters = $this->validatedRecordFilters($request);
        $record = $this->recordsForPatient($request->user()->id, $clinicAssetService)
            ->first(fn (array $item) => $item['category'] === $recordType && $item['source_id'] === $recordId);

        abort_unless($record !== null, 404);

        unset($record['event_timestamp'], $record['search_text']);

        return Inertia::render('Patient/MedicalRecordDetail', [
            'record' => $record,
            'backHref' => route('patient.medical-records.index', $this->recordIndexQuery($filters, $request->integer('page')), false),
        ]);
    }

    private function activePackages(int $patientId): Collection
    {
        return UserPackage::query()
            ->active()
            ->where('user_id', $patientId)
            ->with(['package', 'sourceConsultation', 'progressCheckIns.doctor.user'])
            ->latest('activated_at')
            ->latest('id')
            ->get();
    }

    private function finalizedReports(int $patientId)
    {
        return Consultation::query()
            ->where('user_id', $patientId)
            ->where('patient_report_status', 'finalized')
            ->whereNotNull('patient_report_finalized_at')
            ->with(['doctor.user', 'recommendedPackage', 'userPackage.package'])
            ->latest('completed_at')
            ->latest('id');
    }

    private function mapPackage(UserPackage $userPackage, ClinicAssetService $clinicAssetService): array
    {
        $currentWeek = $userPackage->currentProgramWeek();
        $progressHistory = $userPackage->progressCheckIns->sortBy('program_week')->values();
        $latestReview = $progressHistory->whereNotNull('reviewed_at')->sortByDesc('reviewed_at')->first();
        $mealPlanPath = $userPackage->sourceConsultation?->meal_plan_pdf_path;

        return [
            'id' => $userPackage->id,
            'name' => $userPackage->package?->name,
            'status' => $userPackage->status,
            'current_program_week' => $currentWeek,
            'current_week_submitted' => $progressHistory->contains(fn (CheckIn $checkIn) => $checkIn->program_week === $currentWeek),
            'consultation_credits_remaining' => $userPackage->consultation_credits_remaining,
            'consultation_credits_total' => $userPackage->consultation_credits_total,
            'activated_at' => $userPackage->activated_at?->toIso8601String(),
            'expires_at' => $userPackage->expires_at?->toIso8601String(),
            'meal_plan' => $mealPlanPath ? [
                'name' => basename($mealPlanPath),
                'url' => $clinicAssetService->temporaryAssetUrl($mealPlanPath, now()->addMinutes(30)),
            ] : null,
            'latest_review' => $latestReview ? $this->mapProgramCheckIn($latestReview, $clinicAssetService) : null,
            'progress_history' => $progressHistory
                ->map(fn (CheckIn $checkIn) => $this->mapProgramCheckIn($checkIn, $clinicAssetService))
                ->values(),
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
        ];
    }

    private function engagementFeed(int $patientId): array
    {
        return \App\Models\Booking::query()
            ->where('user_id', $patientId)
            ->where('status', 'confirmed')
            ->whereHas('slot', fn ($query) => $query->where('start_time', '>=', now()))
            ->with(['slot', 'doctor.user'])
            ->orderBy(TimeSlot::query()->select('start_time')->whereColumn('time_slots.id', 'bookings.slot_id'))
            ->take(5)
            ->get()
            ->map(fn ($booking) => [
                'title' => 'Upcoming confirmed consultation',
                'description' => $booking->doctor?->user?->name,
                'event_date' => $booking->slot?->start_time?->toIso8601String(),
            ])
            ->all();
    }

    private function mapReportSummary(Consultation $consultation, ClinicAssetService $clinicAssetService): array
    {
        return [
            'id' => $consultation->id,
            'visit_date' => $consultation->completed_at?->toIso8601String(),
            'doctor_name' => $consultation->doctor?->user?->name,
            'package_name' => $consultation->userPackage?->package?->name ?? $consultation->recommendedPackage?->name,
            'next_control_date' => $consultation->next_control_date?->toDateString(),
            'patient_instructions' => $consultation->patient_instructions,
            'summary' => $consultation->notes,
            'href' => route('patient.reports.show', $consultation, false),
            'meal_plan' => $consultation->meal_plan_pdf_path ? [
                'name' => basename($consultation->meal_plan_pdf_path),
                'url' => $clinicAssetService->temporaryAssetUrl($consultation->meal_plan_pdf_path, now()->addMinutes(30)),
            ] : null,
        ];
    }

    private function metricSummary(int $patientId): array
    {
        return collect($this->progressMetrics($patientId))
            ->map(fn (array $points) => collect($points)->last())
            ->filter()
            ->all();
    }

    private function progressMetrics(int $patientId): array
    {
        $consultations = Consultation::query()
            ->where('user_id', $patientId)
            ->where('patient_report_status', 'finalized')
            ->whereNotNull('patient_report_finalized_at')
            ->orderBy('completed_at')
            ->get();

        $checkIns = CheckIn::query()
            ->where('user_id', $patientId)
            ->progress()
            ->orderBy('checked_in_at')
            ->get();

        $metrics = [
            'weight' => [],
            'bmi' => [],
            'waist' => [],
            'hip' => [],
        ];

        foreach ($consultations as $consultation) {
            $this->pushPoint($metrics['weight'], $consultation->slimming_weight_kg, $consultation->completed_at, 'Visit report');
            $this->pushPoint($metrics['bmi'], $consultation->slimming_bmi, $consultation->completed_at, 'Visit report');
            $this->pushPoint($metrics['waist'], $consultation->slimming_waist_cm, $consultation->completed_at, 'Visit report');
            $this->pushPoint($metrics['hip'], $consultation->slimming_hip_cm, $consultation->completed_at, 'Visit report');
        }

        foreach ($checkIns as $checkIn) {
            $this->pushPoint($metrics['weight'], $checkIn->weight_kg, $checkIn->checked_in_at, 'Week '.$checkIn->program_week);
            $this->pushPoint($metrics['waist'], $checkIn->waist_cm, $checkIn->checked_in_at, 'Week '.$checkIn->program_week);
        }

        return collect($metrics)->map(fn (array $points) => collect($points)->sortBy('date')->values()->all())->all();
    }

    private function pushPoint(array &$points, mixed $value, mixed $date, string $label): void
    {
        if ($value === null || $date === null) {
            return;
        }

        $points[] = [
            'date' => $date->toDateString(),
            'label' => $label,
            'value' => (float) $value,
        ];
    }

    private function mapMetrics(Consultation $consultation): array
    {
        return collect([
            'weight_kg' => $consultation->slimming_weight_kg,
            'bmi' => $consultation->slimming_bmi,
            'waist_cm' => $consultation->slimming_waist_cm,
            'hip_cm' => $consultation->slimming_hip_cm,
            'upper_arm_cm' => $consultation->slimming_upper_arm_cm,
            'abdomen_cm' => $consultation->slimming_abdomen_cm,
            'thigh_cm' => $consultation->slimming_thigh_cm,
            'calf_cm' => $consultation->slimming_calf_cm,
        ])->filter(fn ($value) => $value !== null)->all();
    }

    private function metricComparisons(Consultation $consultation): array
    {
        $previous = Consultation::query()
            ->where('user_id', $consultation->user_id)
            ->where('patient_report_status', 'finalized')
            ->whereNotNull('patient_report_finalized_at')
            ->where('completed_at', '<', $consultation->completed_at)
            ->latest('completed_at')
            ->first();

        if (! $previous) {
            return [];
        }

        return collect([
            'weight_kg' => [$consultation->slimming_weight_kg, $previous->slimming_weight_kg],
            'bmi' => [$consultation->slimming_bmi, $previous->slimming_bmi],
            'waist_cm' => [$consultation->slimming_waist_cm, $previous->slimming_waist_cm],
            'hip_cm' => [$consultation->slimming_hip_cm, $previous->slimming_hip_cm],
        ])->filter(fn (array $values) => $values[0] !== null && $values[1] !== null)
            ->map(fn (array $values) => [
                'current' => (float) $values[0],
                'previous' => (float) $values[1],
                'difference' => round((float) $values[0] - (float) $values[1], 2),
            ])->all();
    }

    private function recordsForPatient(int $patientId, ClinicAssetService $clinicAssetService): Collection
    {
        $consultations = Consultation::query()
            ->where('user_id', $patientId)
            ->whereNotNull('completed_at')
            ->with(['patient', 'booking.patient', 'booking.slot', 'queueEntry', 'lineItems', 'payments', 'userPackage.package'])
            ->get()
            ->map(fn (Consultation $consultation) => $this->mapConsultationArchiveRecord($consultation, $clinicAssetService));

        $progress = CheckIn::query()
            ->where('user_id', $patientId)
            ->progress()
            ->with(['patient', 'doctor.user', 'userPackage.package', 'consultation.doctor.user'])
            ->get()
            ->map(fn (CheckIn $checkIn) => $this->mapProgressArchiveRecord($checkIn, $clinicAssetService));

        return $consultations->concat($progress)->values();
    }

    private function mapPatientIndexRecord(array $record, array $filters, int $currentPage): array
    {
        return [
            'id' => $record['id'],
            'source_id' => $record['source_id'],
            'category' => $record['category'],
            'category_label' => $record['category_label'],
            'title' => $record['title'],
            'summary' => $record['summary'],
            'status' => $record['status'],
            'status_label' => $record['status_label'],
            'event_date' => $record['event_date'],
            'patient' => $record['patient'],
            'package_name' => $record['package_name'],
            'source_label' => $record['source_label'],
            'metadata' => $record['metadata'],
            'attachment_count' => count($record['attachments']),
            'href' => route('patient.medical-records.show', [
                'recordType' => $record['category'],
                'recordId' => $record['source_id'],
                ...$this->recordIndexQuery($filters, $currentPage),
            ], false),
        ];
    }

    private function mapConsultationArchiveRecord(Consultation $consultation, ClinicAssetService $clinicAssetService): array
    {
        $eventAt = $consultation->completed_at ?? $consultation->created_at;
        $attachments = collect([
            $this->mapAttachment('Meal plan', $consultation->meal_plan_pdf_path, $clinicAssetService),
            $this->mapAttachment('Intake upload', $consultation->booking?->patient_upload_path, $clinicAssetService),
        ])->filter()->values()->all();
        $intakeNotes = $consultation->booking?->notes ?? $consultation->queueEntry?->complaint_notes;
        $summarySource = $consultation->notes ?: $intakeNotes ?: 'Completed consultation record.';

        return [
            'id' => 'consultation-'.$consultation->id,
            'source_id' => $consultation->id,
            'category' => 'consultation',
            'category_label' => 'Consultation',
            'title' => 'Consultation with '.($consultation->doctor?->user?->name ?? 'clinic doctor'),
            'summary' => $this->summarize($summarySource),
            'status' => 'completed',
            'status_label' => 'Completed',
            'event_date' => $eventAt?->toIso8601String(),
            'event_timestamp' => $eventAt?->timestamp ?? 0,
            'patient' => $consultation->patient ? [
                'id' => $consultation->patient->id,
                'name' => $consultation->patient->name,
                'email' => $consultation->patient->email,
                'phone' => $consultation->patient->phone,
            ] : null,
            'package_name' => $consultation->userPackage?->package?->name,
            'source_label' => 'Consultation notes and follow-up documents',
            'full_note' => $consultation->notes,
            'review_note' => null,
            'intake_notes' => $intakeNotes,
            'slimming_metrics' => $this->mapMetrics($consultation),
            'line_items' => $consultation->lineItems->map(fn ($lineItem) => [
                'id' => $lineItem->id,
                'type' => $lineItem->type,
                'name' => $lineItem->name,
                'quantity' => $lineItem->quantity,
                'dosage_value' => $lineItem->dosage_value,
                'dosage_unit' => $lineItem->dosage_unit,
                'unit_price' => $lineItem->unit_price,
                'line_total' => $lineItem->line_total,
                'notes' => $lineItem->notes,
            ])->values()->all(),
            'attachments' => $attachments,
            'metadata' => array_values(array_filter([
                $consultation->booking?->slot?->start_time ? 'Booked '.$consultation->booking->slot->start_time->format('d M Y H:i') : null,
                $consultation->userPackage?->package?->name ? 'Linked package: '.$consultation->userPackage->package->name : null,
            ])),
            'search_text' => Str::lower(implode(' ', array_filter([
                $consultation->notes,
                $consultation->patient_instructions,
                $consultation->booking?->notes,
                $consultation->userPackage?->package?->name,
                collect($attachments)->pluck('name')->implode(' '),
            ]))),
        ];
    }

    private function mapProgressArchiveRecord(CheckIn $checkIn, ClinicAssetService $clinicAssetService): array
    {
        $eventAt = $checkIn->checked_in_at ?? $checkIn->reviewed_at ?? $checkIn->created_at;
        $reviewingDoctorName = $checkIn->doctor?->user?->name ?? $checkIn->consultation?->doctor?->user?->name;
        $attachments = collect([
            $this->mapAttachment('Progress photo', $checkIn->progress_photo_path, $clinicAssetService),
            $this->mapAttachment('Supporting document', $checkIn->supporting_document_path, $clinicAssetService),
        ])->filter()->values()->all();
        $summarySource = $checkIn->review_notes ?: $checkIn->notes ?: 'Weekly progress update submitted.';

        return [
            'id' => 'check-in-'.$checkIn->id,
            'source_id' => $checkIn->id,
            'category' => 'progress',
            'category_label' => 'Program progress',
            'title' => 'Week '.$checkIn->program_week.' progress',
            'summary' => $this->summarize($summarySource),
            'status' => $checkIn->reviewed_at ? 'reviewed' : 'submitted',
            'status_label' => $checkIn->reviewed_at ? 'Reviewed' : 'Submitted',
            'event_date' => $eventAt?->toIso8601String(),
            'event_timestamp' => $eventAt?->timestamp ?? 0,
            'patient' => $checkIn->patient ? [
                'id' => $checkIn->patient->id,
                'name' => $checkIn->patient->name,
                'email' => $checkIn->patient->email,
                'phone' => $checkIn->patient->phone,
            ] : null,
            'package_name' => $checkIn->userPackage?->package?->name,
            'source_label' => 'Weekly check-in and doctor follow-up',
            'full_note' => $checkIn->notes,
            'review_note' => $checkIn->review_notes,
            'intake_notes' => null,
            'weight_kg' => $checkIn->weight_kg,
            'waist_cm' => $checkIn->waist_cm,
            'attachments' => $attachments,
            'metadata' => array_values(array_filter([
                $checkIn->weight_kg !== null ? 'Weight '.$checkIn->weight_kg.' kg' : null,
                $checkIn->waist_cm !== null ? 'Waist '.$checkIn->waist_cm.' cm' : null,
                $checkIn->reviewed_at && $reviewingDoctorName ? 'Reviewed by '.$reviewingDoctorName : null,
            ])),
            'search_text' => Str::lower(implode(' ', array_filter([
                'week '.$checkIn->program_week,
                $checkIn->notes,
                $checkIn->review_notes,
                $checkIn->userPackage?->package?->name,
                collect($attachments)->pluck('name')->implode(' '),
            ]))),
        ];
    }

    private function mapAttachment(string $label, ?string $path, ClinicAssetService $clinicAssetService): ?array
    {
        if (! $path) {
            return null;
        }

        return [
            'label' => $label,
            'name' => basename($path),
            'url' => $clinicAssetService->temporaryAssetUrl($path, now()->addMinutes(30)),
        ];
    }

    private function validatedRecordFilters(Request $request): array
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::in(['consultation', 'progress'])],
            'date_window' => ['nullable', Rule::in(['all', 'last_30_days', 'last_90_days', 'last_365_days'])],
        ]);

        return [
            'search' => trim((string) ($filters['search'] ?? '')),
            'category' => (string) ($filters['category'] ?? ''),
            'date_window' => (string) ($filters['date_window'] ?? 'all'),
        ];
    }

    private function matchesRecordFilters(array $record, array $filters): bool
    {
        if ($filters['category'] !== '' && $record['category'] !== $filters['category']) {
            return false;
        }

        if ($filters['search'] !== '' && ! str_contains($record['search_text'], Str::lower($filters['search']))) {
            return false;
        }

        if ($filters['date_window'] === 'all') {
            return true;
        }

        if (! $record['event_date']) {
            return false;
        }

        $eventAt = Carbon::parse($record['event_date']);

        return match ($filters['date_window']) {
            'last_30_days' => $eventAt->greaterThanOrEqualTo(now()->subDays(30)),
            'last_90_days' => $eventAt->greaterThanOrEqualTo(now()->subDays(90)),
            'last_365_days' => $eventAt->greaterThanOrEqualTo(now()->subDays(365)),
            default => true,
        };
    }

    private function recordIndexQuery(array $filters, ?int $page = null): array
    {
        $query = [];

        if ($filters['search'] !== '') {
            $query['search'] = $filters['search'];
        }

        if ($filters['category'] !== '') {
            $query['category'] = $filters['category'];
        }

        if ($filters['date_window'] !== 'all') {
            $query['date_window'] = $filters['date_window'];
        }

        if ($page !== null && $page > 1) {
            $query['page'] = $page;
        }

        return $query;
    }

    private function paginateRecords(Collection $records, int $currentPage, int $perPage): LengthAwarePaginator
    {
        $total = $records->count();
        $lastPage = max((int) ceil($total / $perPage), 1);
        $currentPage = min($currentPage, $lastPage);

        return new LengthAwarePaginator($records->forPage($currentPage, $perPage)->values(), $total, $perPage, $currentPage);
    }

    private function summarize(string $value): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim($value)) ?: 'Medical record entry';

        return Str::limit($normalized, 160);
    }
}
