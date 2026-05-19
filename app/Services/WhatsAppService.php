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

        match (config('services.whatsapp.provider', 'log')) {
            'fonnte' => $this->sendViaFonnte($phone, $message),
            'wablas' => $this->sendViaWablas($phone, $message),
            default => Log::info('WhatsApp notification logged.', [
                'phone' => $phone,
                'message' => $message,
            ]),
        };
    }

    private function sendViaFonnte(string $phone, string $message): void
    {
        $token = config('services.fonnte.token');

        if (blank($token)) {
            Log::warning('Fonnte notification skipped because no token is configured.', [
                'phone' => $phone,
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

    private function sendViaWablas(string $phone, string $message): void
    {
        $token = config('services.wablas.token');

        if (blank($token)) {
            Log::warning('Wablas notification skipped because no token is configured.', [
                'phone' => $phone,
            ]);

            return;
        }

        Http::asForm()
            ->withHeaders(['Authorization' => $token])
            ->post(config('services.wablas.url', 'https://www.wablas.com/api/send-message'), [
                'phone' => $phone,
                'message' => $message,
            ])
            ->throw();
    }
}
