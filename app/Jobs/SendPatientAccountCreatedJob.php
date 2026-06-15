<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPatientAccountCreatedJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(
        public int $userId,
        public string $temporaryPassword,
    ) {
        $this->afterCommit();
    }

    public function handle(WhatsAppService $whatsAppService): void
    {
        $user = User::query()->find($this->userId);

        if (! $user || $user->role !== 'patient') {
            return;
        }

        $whatsAppService->send($user->phone, sprintf(
            'Your MORE patient portal account is ready. Login with phone %s and temporary password %s. Please change this password after signing in.',
            $user->phone,
            $this->temporaryPassword,
        ));
    }
}
