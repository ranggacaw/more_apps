<?php

namespace App\Jobs;

use App\Models\UserPackage;
use App\Models\CheckIn;
use App\Services\EmailNotificationService;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendUserPackageNotificationJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(
        public UserPackage $userPackage,
        public string $type,
        public ?int $checkInId = null,
    ) {
        $this->afterCommit();
    }

    public function handle(EmailNotificationService $emailNotificationService, WhatsAppService $whatsAppService): void
    {
        $userPackage = $this->userPackage->fresh(['user', 'package']);

        if (! $userPackage) {
            return;
        }

        $checkIn = $this->checkInId ? CheckIn::query()->find($this->checkInId) : null;
        $currentWeek = $userPackage->currentProgramWeek();

        $subject = match ($this->type) {
            'activation' => 'Your package is active',
            'weekly-check-in-reminder' => 'Your weekly check-in is due',
            'weekly-review-available' => 'Your weekly review is ready',
            default => 'Package update',
        };

        $message = match ($this->type) {
            'weekly-check-in-reminder' => sprintf(
                '%s: %s is waiting for your week %d progress update.',
                $subject,
                $userPackage->package->name,
                $currentWeek,
            ),
            'weekly-review-available' => sprintf(
                '%s: your doctor has reviewed week %d for %s. Sign in to read the latest notes.',
                $subject,
                $checkIn?->program_week ?? $currentWeek,
                $userPackage->package->name,
            ),
            default => sprintf(
                '%s: %s with %d remaining consultation credits.',
                $subject,
                $userPackage->package->name,
                $userPackage->consultation_credits_remaining,
            ),
        };

        $emailNotificationService->send($userPackage->user->email, $subject, $message);
        $whatsAppService->send($userPackage->user->phone, $message);
    }
}
