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
        $booking = $this->booking->fresh(['patient', 'doctor.user', 'slot']);

        if (! $booking) {
            return;
        }

        $subject = match ($this->type) {
            'confirmation' => 'Your consultation is confirmed',
            'day-before-reminder' => 'Reminder for tomorrow\'s consultation',
            default => 'Reminder for your upcoming consultation',
        };

        $message = sprintf(
            '%s with %s on %s.',
            $subject,
            $booking->doctor->user->name,
            $booking->slot->start_time->format('D, d M Y H:i')
        );

        $emailNotificationService->send($booking->patient->email, $subject, $message);
        $whatsAppService->send($booking->patient->phone, $message);
    }
}
