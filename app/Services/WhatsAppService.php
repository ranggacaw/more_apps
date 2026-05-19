<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public function send(?string $phone, string $message): void
    {
        if (blank($phone)) {
            return;
        }

        $token = config('services.fonnte.token');

        if (blank($token)) {
            Log::info('WhatsApp notification skipped because no token is configured.', [
                'phone' => $phone,
                'message' => $message,
            ]);

            return;
        }

        Http::asForm()
            ->withHeaders(['Authorization' => $token])
            ->post(config('services.fonnte.url', 'https://api.fonnte.com/send'), [
                'target' => $phone,
                'message' => $message,
            ])
            ->throw();
    }
}
