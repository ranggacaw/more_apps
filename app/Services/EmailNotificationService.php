<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailNotificationService
{
    public function send(?string $email, string $subject, string $message): void
    {
        if (blank($email)) {
            return;
        }

        if (config('services.clinic_email.provider') === 'log') {
            Log::info('Clinic email notification logged.', [
                'email' => $email,
                'subject' => $subject,
                'message' => $message,
            ]);

            return;
        }

        Mail::raw($message, function ($mail) use ($email, $subject): void {
            $mail->to($email)->subject($subject);
        });
    }
}
