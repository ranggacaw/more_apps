<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\PatientOtpService;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;

class SendPatientOtpJob implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $tries = 3;

    public function __construct(
        public User $user,
        public string $otp,
    ) {
        $this->afterCommit();
    }

    public function handle(WhatsAppService $whatsAppService): void
    {
        if ($this->user->hasVerifiedEmail()) {
            return;
        }

        $minutes = PatientOtpService::EXPIRATION_MINUTES;

        $whatsAppService->send(
            $this->user->phone,
            sprintf('%s is your %s verification code. It expires in %d minutes.', $this->otp, config('app.name'), $minutes),
        );
    }
}
