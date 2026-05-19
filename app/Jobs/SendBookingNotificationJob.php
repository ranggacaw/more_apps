<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Services\EmailNotificationService;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendBookingNotificationJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(
        public Booking $booking,
        public string $type,
    ) {
        $this->afterCommit();
    }

    public function handle(EmailNotificationService $emailNotificationService, WhatsAppService $whatsAppService): void
    {
        $booking = $this->booking->fresh(['patient', 'doctor.user', 'slot', 'consultation.recommendedPackage']);

        if (! $booking) {
            return;
        }

        $subject = match ($this->type) {
            'confirmation' => 'Your consultation is confirmed',
            'day-before-reminder' => 'Reminder for tomorrow\'s consultation',
            'completion-follow-up' => 'Your consultation is complete',
            default => 'Reminder for your upcoming consultation',
        };

        if ($this->type === 'completion-follow-up') {
            $message = sprintf(
                '%s with %s has been marked complete. Please sign in and continue to package selection for your next care step.',
                $subject,
                $booking->doctor->user->name,
            );

            if (filled($booking->consultation?->recommendedPackage?->name)) {
                $message .= ' Recommended package: '.$booking->consultation->recommendedPackage->name.'.';
            }
        } else {
            $message = sprintf(
                '%s with %s on %s.',
                $subject,
                $booking->doctor->user->name,
                $booking->slot->start_time->format('D, d M Y H:i')
            );

            if ($this->type === 'confirmation' && filled($booking->meeting_link)) {
                $message .= ' Join using '.$booking->meeting_link.'.';
            }
        }

        $emailNotificationService->send($booking->patient->email, $subject, $message);
        $whatsAppService->send($booking->patient->phone, $message);
    }
}
