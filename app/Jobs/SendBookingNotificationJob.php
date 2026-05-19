<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendBookingNotificationJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Booking $booking,
        public string $type,
    ) {}

    public function handle(WhatsAppService $whatsAppService): void
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

        Mail::raw($message, function ($mail) use ($booking, $subject): void {
            $mail->to($booking->patient->email)
                ->subject($subject);
        });

        $whatsAppService->send($booking->patient->phone, $message);
    }
}
