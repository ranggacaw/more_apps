<?php

namespace App\Http\Controllers;

use App\Models\CheckIn;
use App\Models\Consultation;
use App\Services\ClinicAssetService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DoctorMedicalRecordController extends Controller
{
    public function index(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $doctor = $request->user()->doctorProfile()->with('user')->firstOrFail();
        $filters = $this->validatedFilters($request);
        $currentPage = max($request->integer('page', 1), 1);

        $records = $this->recordsForDoctor($doctor->id, $clinicAssetService)
            ->filter(fn (array $record) => $this->matchesFilters($record, $filters))
            ->sortByDesc('event_timestamp')
            ->values();

        $paginatedRecords = $this->paginateRecords(
            $records->map(fn (array $record) => $this->mapIndexRecord($record, $filters, $currentPage))->values(),
            $currentPage,
            10,
        );

        return Inertia::render('Doctor/MedicalRecords', [
            'doctor' => $this->doctorPayload($doctor),
            'filters' => $filters,
            'categoryOptions' => [
                ['value' => '', 'label' => 'All categories'],
                ['value' => 'consultation', 'label' => 'Consultations'],
                ['value' => 'progress', 'label' => 'Program progress'],
            ],
            'dateWindowOptions' => [
                ['value' => 'all', 'label' => 'All time'],
                ['value' => 'last_30_days', 'label' => 'Last 30 days'],
                ['value' => 'last_90_days', 'label' => 'Last 90 days'],
                ['value' => 'last_365_days', 'label' => 'Last 12 months'],
            ],
            'stats' => [
                'total_records' => $records->count(),
                'patient_count' => $records->pluck('patient.id')->filter()->unique()->count(),
                'consultation_records' => $records->where('category', 'consultation')->count(),
                'progress_records' => $records->where('category', 'progress')->count(),
            ],
            'records' => $paginatedRecords->items(),
            'pagination' => [
                'current_page' => $paginatedRecords->currentPage(),
                'last_page' => $paginatedRecords->lastPage(),
                'per_page' => $paginatedRecords->perPage(),
                'total' => $paginatedRecords->total(),
                'from' => $paginatedRecords->firstItem(),
                'to' => $paginatedRecords->lastItem(),
                'has_pages' => $paginatedRecords->hasPages(),
            ],
        ]);
    }

    public function show(Request $request, string $recordType, int $recordId, ClinicAssetService $clinicAssetService): Response
    {
        $doctor = $request->user()->doctorProfile()->with('user')->firstOrFail();
        $filters = $this->validatedFilters($request);
        $record = $this->recordsForDoctor($doctor->id, $clinicAssetService)
            ->first(fn (array $item) => $item['category'] === $recordType && $item['source_id'] === $recordId);

        abort_unless($record !== null, 404);

        unset($record['event_timestamp'], $record['search_text']);

        return Inertia::render('Doctor/MedicalRecordDetail', [
            'doctor' => $this->doctorPayload($doctor),
            'record' => $record,
            'backHref' => route('doctor.medical-records.index', $this->indexQuery($filters, $request->integer('page')), false),
        ]);
    }

    private function recordsForDoctor(int $doctorId, ClinicAssetService $clinicAssetService): Collection
    {
        $consultationRecords = Consultation::query()
            ->where('doctor_id', $doctorId)
            ->whereNotNull('completed_at')
            ->with(['patient', 'booking.patient', 'booking.slot', 'queueEntry', 'lineItems', 'payments', 'userPackage.package'])
            ->get()
            ->map(fn (Consultation $consultation) => $this->mapConsultationRecord($consultation, $clinicAssetService));

        $progressRecords = CheckIn::query()
            ->progress()
            ->whereHas('userPackage.sourceConsultation', fn ($query) => $query
                ->where('doctor_id', $doctorId)
                ->whereNotNull('completed_at'))
            ->with(['patient', 'doctor.user', 'userPackage.package', 'consultation.doctor.user'])
            ->get()
            ->map(fn (CheckIn $checkIn) => $this->mapProgressRecord($checkIn, $clinicAssetService));

        return $consultationRecords->concat($progressRecords)->values();
    }

    private function mapIndexRecord(array $record, array $filters, int $currentPage): array
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
            'href' => route('doctor.medical-records.show', [
                'recordType' => $record['category'],
                'recordId' => $record['source_id'],
                ...$this->indexQuery($filters, $currentPage),
            ], false),
        ];
    }

    private function paginateRecords(Collection $records, int $currentPage, int $perPage): LengthAwarePaginator
    {
        $total = $records->count();
        $lastPage = max((int) ceil($total / $perPage), 1);
        $currentPage = min($currentPage, $lastPage);

        return new LengthAwarePaginator(
            $records->forPage($currentPage, $perPage)->values(),
            $total,
            $perPage,
            $currentPage,
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
                'pageName' => 'page',
            ],
        );
    }

    private function doctorPayload(object $doctor): array
    {
        return [
            'name' => $doctor->user->name,
            'specialization' => $doctor->specialization,
            'bio' => $doctor->bio,
        ];
    }

    private function validatedFilters(Request $request): array
    {
        $filters = $request->validate([
            'patient_name' => ['nullable', 'string', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::in(['consultation', 'progress'])],
            'date_window' => ['nullable', Rule::in(['all', 'last_30_days', 'last_90_days', 'last_365_days'])],
        ]);

        return [
            'patient_name' => trim((string) ($filters['patient_name'] ?? '')),
            'search' => trim((string) ($filters['search'] ?? '')),
            'category' => (string) ($filters['category'] ?? ''),
            'date_window' => (string) ($filters['date_window'] ?? 'all'),
        ];
    }

    private function indexQuery(array $filters, ?int $page = null): array
    {
        $query = [];

        if ($filters['patient_name'] !== '') {
            $query['patient_name'] = $filters['patient_name'];
        }

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

    private function mapConsultationRecord(Consultation $consultation, ClinicAssetService $clinicAssetService): array
    {
        $patient = $this->consultationPatient($consultation);
        $patientName = $patient['name'] ?? null;
        $eventAt = $consultation->completed_at ?? $consultation->created_at;
        $payments = $consultation->payments
            ->where('type', 'consultation_treatment')
            ->values();
        $attachments = collect([
            $this->mapAttachment('Meal plan', $consultation->meal_plan_pdf_path, $clinicAssetService),
            $this->mapAttachment('Intake upload', $consultation->booking?->patient_upload_path, $clinicAssetService),
        ])->filter()->values()->all();

        $intakeNotes = $consultation->booking?->notes ?? $consultation->queueEntry?->complaint_notes;
        $summarySource = $consultation->notes ?: $intakeNotes ?: 'Completed consultation record.';

        return [
            'id' => 'consultation-'.$consultation->id,
            'source_id' => $consultation->id,
            'type' => 'consultation',
            'category' => 'consultation',
            'category_label' => 'Consultation',
            'title' => $patientName ? 'Consultation for '.$patientName : 'Completed consultation',
            'summary' => $this->summarize($summarySource),
            'status' => 'completed',
            'status_label' => 'Completed',
            'event_date' => $eventAt?->toIso8601String(),
            'event_timestamp' => $eventAt?->timestamp ?? 0,
            'patient' => $patient,
            'package_name' => $consultation->userPackage?->package?->name,
            'source_label' => $consultation->queue_entry_id ? 'Walk-in consultation notes and billing handoff' : 'Consultation notes and follow-up documents',
            'full_note' => $consultation->notes,
            'review_note' => null,
            'intake_notes' => $intakeNotes,
            'slimming_metrics' => $this->slimmingMetrics($consultation),
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
            'billing' => [
                'status' => $payments->isEmpty()
                    ? null
                    : ($payments->contains(fn ($payment) => $payment->status === 'pending') ? 'pending' : 'paid'),
                'total_amount' => (int) $payments->sum('amount'),
                'paid_amount' => (int) $payments->where('status', 'paid')->sum('amount'),
                'pending_amount' => (int) $payments->where('status', 'pending')->sum('amount'),
                'payments' => $payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'status' => $payment->status,
                    'amount' => $payment->amount,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                    'created_at' => $payment->created_at?->toIso8601String(),
                ])->all(),
            ],
            'attachments' => $attachments,
            'metadata' => array_values(array_filter([
                $consultation->booking?->slot?->start_time ? 'Booked '.$consultation->booking->slot->start_time->format('d M Y H:i') : null,
                $consultation->booking_id ? 'Booking #'.$consultation->booking_id : null,
                $consultation->queueEntry?->queue_number ? 'Walk-in queue '.$consultation->queueEntry->queue_number : null,
                $consultation->userPackage?->package?->name ? 'Linked package: '.$consultation->userPackage->package->name : null,
            ])),
            'search_text' => Str::lower(implode(' ', array_filter([
                $patientName,
                $patient['email'] ?? null,
                $patient['phone'] ?? null,
                $consultation->notes,
                $consultation->booking?->notes,
                $consultation->queueEntry?->complaint_notes,
                $consultation->userPackage?->package?->name,
                $consultation->lineItems->pluck('name')->implode(' '),
                collect($attachments)->pluck('name')->implode(' '),
            ]))),
        ];
    }

    private function consultationPatient(Consultation $consultation): ?array
    {
        if ($consultation->patient) {
            return [
                'id' => $consultation->patient->id,
                'name' => $consultation->patient->name,
                'email' => $consultation->patient->email,
                'phone' => $consultation->patient->phone,
                'source' => 'registered',
            ];
        }

        if ($consultation->booking) {
            return [
                'id' => null,
                'name' => $consultation->booking->patientDisplayName(),
                'email' => $consultation->booking->patientContactEmail(),
                'phone' => $consultation->booking->patientContactPhone(),
                'source' => $consultation->booking->isGuestBooking() ? 'guest_booking' : 'booking',
            ];
        }

        if ($consultation->queueEntry) {
            return [
                'id' => null,
                'name' => $consultation->queueEntry->patient_name,
                'email' => null,
                'phone' => $consultation->queueEntry->patient_phone,
                'source' => 'walk_in',
            ];
        }

        return null;
    }

    private function slimmingMetrics(Consultation $consultation): array
    {
        return collect([
            ['label' => 'Weight', 'value' => $consultation->slimming_weight_kg, 'unit' => 'kg'],
            ['label' => 'BMI', 'value' => $consultation->slimming_bmi, 'unit' => ''],
            ['label' => 'VFA', 'value' => $consultation->slimming_vfa, 'unit' => ''],
            ['label' => 'Body Fat', 'value' => $consultation->slimming_body_fat_percentage, 'unit' => '%'],
            ['label' => 'Body Age', 'value' => $consultation->slimming_body_age, 'unit' => 'years'],
            ['label' => 'Muscle Mass', 'value' => $consultation->slimming_muscle_mass, 'unit' => 'kg'],
            ['label' => 'Upper Arm', 'value' => $consultation->slimming_upper_arm_cm, 'unit' => 'cm'],
            ['label' => 'Waist', 'value' => $consultation->slimming_waist_cm, 'unit' => 'cm'],
            ['label' => 'Abdomen', 'value' => $consultation->slimming_abdomen_cm, 'unit' => 'cm'],
            ['label' => 'Hip', 'value' => $consultation->slimming_hip_cm, 'unit' => 'cm'],
            ['label' => 'Thigh', 'value' => $consultation->slimming_thigh_cm, 'unit' => 'cm'],
            ['label' => 'Calf', 'value' => $consultation->slimming_calf_cm, 'unit' => 'cm'],
            ['label' => 'Metabolism / BMR', 'value' => $consultation->slimming_metabolism_bmr, 'unit' => ''],
            ['label' => 'Anti-Oxidant', 'value' => $consultation->slimming_anti_oxidant, 'unit' => ''],
        ])
            ->filter(fn (array $metric) => $metric['value'] !== null)
            ->values()
            ->all();
    }

    private function mapProgressRecord(CheckIn $checkIn, ClinicAssetService $clinicAssetService): array
    {
        $eventAt = $checkIn->checked_in_at ?? $checkIn->reviewed_at ?? $checkIn->created_at;
        $patientName = $checkIn->patient?->name;
        $reviewingDoctorName = $checkIn->doctor?->user?->name ?? $checkIn->consultation?->doctor?->user?->name;
        $attachments = collect([
            $this->mapAttachment('Progress photo', $checkIn->progress_photo_path, $clinicAssetService),
            $this->mapAttachment('Supporting document', $checkIn->supporting_document_path, $clinicAssetService),
        ])->filter()->values()->all();

        $summarySource = $checkIn->review_notes ?: $checkIn->notes ?: 'Weekly progress update submitted.';

        return [
            'id' => 'check-in-'.$checkIn->id,
            'source_id' => $checkIn->id,
            'type' => 'check_in',
            'category' => 'progress',
            'category_label' => 'Program progress',
            'title' => 'Week '.$checkIn->program_week.' progress for '.($patientName ?: 'patient'),
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
                $patientName,
                $checkIn->patient?->email,
                $checkIn->patient?->phone,
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

    private function matchesFilters(array $record, array $filters): bool
    {
        if ($filters['category'] !== '' && $record['category'] !== $filters['category']) {
            return false;
        }

        if ($filters['patient_name'] !== '') {
            $patientName = Str::lower((string) data_get($record, 'patient.name', ''));

            if (! str_contains($patientName, Str::lower($filters['patient_name']))) {
                return false;
            }
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

    private function summarize(string $value): string
    {
        $normalized = preg_replace('/\s+/', ' ', trim($value)) ?: 'Medical record entry';

        return Str::limit($normalized, 160);
    }
}
