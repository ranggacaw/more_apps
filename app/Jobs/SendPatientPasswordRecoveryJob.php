<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPatientPasswordRecoveryJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(
        public int $userId,
        public string $resetUrl,
    ) {
        $this->afterCommit();
    }

    public function handle(WhatsAppService $whatsAppService): void
    {
        $user = User::query()->find($this->userId);

        if (! $user || $user->role !== 'patient') {
            return;
        }

        $whatsAppService->send($user->phone, 'Reset your MORE patient portal password here: '.$this->resetUrl);
    }
}
