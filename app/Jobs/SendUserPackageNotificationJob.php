<?php

namespace App\Jobs;

use App\Models\UserPackage;
use App\Services\EmailNotificationService;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendUserPackageNotificationJob implements ShouldQueue
{
    use Queueable;

    public $afterCommit = true;

    public $tries = 3;

    public function __construct(
        public UserPackage $userPackage,
        public string $type,
    ) {}

    public function handle(EmailNotificationService $emailNotificationService, WhatsAppService $whatsAppService): void
    {
        $userPackage = $this->userPackage->fresh(['user', 'package']);

        if (! $userPackage) {
            return;
        }

        $subject = match ($this->type) {
            'activation' => 'Your package is active',
            default => 'Package update',
        };

        $message = sprintf(
            '%s: %s with %d remaining consultation credits.',
            $subject,
            $userPackage->package->name,
            $userPackage->consultation_credits_remaining,
        );

        $emailNotificationService->send($userPackage->user->email, $subject, $message);
        $whatsAppService->send($userPackage->user->phone, $message);
    }
}
