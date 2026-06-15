<?php

namespace App\Jobs;

use App\Models\Consultation;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPatientReportAvailableJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(public int $consultationId)
    {
        $this->afterCommit();
    }

    public function handle(WhatsAppService $whatsAppService): void
    {
        $consultation = Consultation::query()->with('patient')->find($this->consultationId);

        if (! $consultation || ! $consultation->patient || $consultation->patient_report_notified_at) {
            return;
        }

        $whatsAppService->send($consultation->patient->phone, 'Your MORE visit report is now available in the patient portal.');

        $consultation->update(['patient_report_notified_at' => now()]);
    }
}
