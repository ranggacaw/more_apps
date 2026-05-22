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
    public function __invoke(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $filters = $request->validate([
            'patient_name' => ['nullable', 'string', 'max:100'],
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::in(['consultation', 'progress'])],
            'date_window' => ['nullable', Rule::in(['all', 'last_30_days', 'last_90_days', 'last_365_days'])],
        ]);

        $filters = [
            'patient_name' => trim((string) ($filters['patient_name'] ?? '')),
            'search' => trim((string) ($filters['search'] ?? '')),
            'category' => (string) ($filters['category'] ?? ''),
            'date_window' => (string) ($filters['date_window'] ?? 'all'),
        ];
        $currentPage = max($request->integer('page', 1), 1);

        $doctor = $request->user()->doctorProfile()->with('user')->firstOrFail();

        $consultationRecords = $doctor->consultations()
            ->whereNotNull('completed_at')
            ->with(['patient', 'booking.slot', 'userPackage.package'])
            ->get()
            ->map(fn (Consultation $consultation) => $this->mapConsultationRecord($consultation, $clinicAssetService));

        $progressRecords = CheckIn::query()
            ->progress()
            ->whereHas('userPackage.sourceConsultation', fn ($query) => $query
                ->where('doctor_id', $doctor->id)
                ->whereNotNull('completed_at'))
            ->with(['patient', 'doctor.user', 'userPackage.package', 'consultation.doctor.user'])
            ->get()
            ->map(fn (CheckIn $checkIn) => $this->mapProgressRecord($checkIn, $clinicAssetService));

        $records = $consultationRecords
            ->concat($progressRecords)
            ->filter(fn (array $record) => $this->matchesFilters($record, $filters))
            ->sortByDesc('event_timestamp')
            ->values();

        $paginatedRecords = $this->paginateRecords(
            $records->map(function (array $record) {
                unset($record['event_timestamp'], $record['search_text']);

                return $record;
            })->values(),
            $currentPage,
            10,
        );

        return Inertia::render('Doctor/MedicalRecords', [
            'doctor' => [
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
                'bio' => $doctor->bio,
            ],
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

    private function mapConsultationRecord(Consultation $consultation, ClinicAssetService $clinicAssetService): array
    {
        $patientName = $consultation->patient?->name;
        $eventAt = $consultation->completed_at ?? $consultation->created_at;
        $attachments = collect([
            $this->mapAttachment('Meal plan', $consultation->meal_plan_pdf_path, $clinicAssetService),
            $this->mapAttachment('Intake upload', $consultation->booking?->patient_upload_path, $clinicAssetService),
        ])->filter()->values()->all();

        $summarySource = $consultation->notes ?: $consultation->booking?->notes ?: 'Completed consultation record.';

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
            'intake_notes' => $consultation->booking?->notes,
            'attachments' => $attachments,
            'metadata' => array_values(array_filter([
                $consultation->booking?->slot?->start_time ? 'Booked '.$consultation->booking->slot->start_time->format('d M Y H:i') : null,
                $consultation->userPackage?->package?->name ? 'Linked package: '.$consultation->userPackage->package->name : null,
            ])),
            'search_text' => Str::lower(implode(' ', array_filter([
                $patientName,
                $consultation->patient?->email,
                $consultation->patient?->phone,
                $consultation->notes,
                $consultation->booking?->notes,
                $consultation->userPackage?->package?->name,
                collect($attachments)->pluck('name')->implode(' '),
            ]))),
        ];
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
            'url' => $clinicAssetService->temporaryUrl($path, now()->addMinutes(30)),
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
