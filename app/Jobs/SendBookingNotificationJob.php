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
            'admin-booking-confirmation' => 'Your consultation is confirmed',
            'doctor-link-request' => 'Google Meet link required for online consultation',
            'meeting-link-ready' => 'Your consultation meeting link is ready',
            'day-before-reminder' => 'Reminder for tomorrow\'s consultation',
            'completion-follow-up' => 'Your consultation is complete',
            default => 'Reminder for your upcoming consultation',
        };

        $message = match ($this->type) {
            'doctor-link-request' => sprintf(
                'An admin has confirmed an online consultation with %s on %s. Please add a Google Meet link from your consultation workspace.',
                $booking->patientDisplayName(),
                $booking->slot->start_time->format('D, d M Y H:i'),
            ),
            'meeting-link-ready' => sprintf(
                'Your online consultation with %s on %s is ready. Join using %s.',
                $booking->doctor->user->name,
                $booking->slot->start_time->format('D, d M Y H:i'),
                $booking->meeting_link,
            ),
            'completion-follow-up' => $this->buildCompletionFollowUpMessage($booking),
            default => $this->buildScheduleMessage($booking, $subject),
        };

        if ($this->type === 'doctor-link-request') {
            $emailNotificationService->send($booking->doctor->user->email, $subject, $message);
            $whatsAppService->send($booking->doctor->user->phone, $message);

            return;
        }

        $contactEmail = $booking->patientContactEmail();
        $contactPhone = $booking->patientContactPhone();

        if ($contactEmail) {
            $emailNotificationService->send($contactEmail, $subject, $message);
        }

        $whatsAppService->send($contactPhone, $message);
    }

    private function buildScheduleMessage(Booking $booking, string $subject): string
    {
        $message = sprintf(
            '%s with %s on %s.',
            $subject,
            $booking->doctor->user->name,
            $booking->slot->start_time->format('D, d M Y H:i'),
        );

        if (filled($booking->meeting_link)) {
            $message .= ' Join using '.$booking->meeting_link.'.';
        }

        return $message;
    }

    private function buildCompletionFollowUpMessage(Booking $booking): string
    {
        $message = sprintf(
            'Your consultation with %s has been marked complete. Please sign in and continue to package selection for your next care step.',
            $booking->doctor->user->name,
        );

        if (filled($booking->consultation?->recommendedPackage?->name)) {
            $message .= ' Recommended package: '.$booking->consultation->recommendedPackage->name.'.';
        }

        return $message;
    }
}
