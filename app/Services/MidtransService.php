<?php

namespace App\Services;

use App\Models\Payment;
use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    /**
     * @return array{token: string, is_demo: bool}
     */
    public function createConsultationTransaction(Payment $payment): array
    {
        $booking = $payment->booking()->with(['patient', 'doctor.user', 'slot'])->firstOrFail();

        if (! $this->isConfigured()) {
            return [
                'token' => 'demo-'.$payment->midtrans_order_id,
                'is_demo' => true,
            ];
        }

        Config::$serverKey = (string) config('midtrans.server_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;

        $token = Snap::getSnapToken([
            'transaction_details' => [
                'order_id' => $payment->midtrans_order_id,
                'gross_amount' => $payment->amount,
            ],
            'customer_details' => [
                'first_name' => $booking->patient->name,
                'email' => $booking->patient->email,
                'phone' => $booking->patient->phone,
            ],
            'item_details' => [[
                'id' => 'CONSULTATION-'.$booking->id,
                'price' => $payment->amount,
                'quantity' => 1,
                'name' => 'MORE Clinic Consultation',
            ]],
        ]);

        return [
            'token' => $token,
            'is_demo' => false,
        ];
    }

    public function validateSignature(array $payload): bool
    {
        if (! $this->isConfigured()) {
            return app()->environment(['local', 'testing']);
        }

        $expectedSignature = hash('sha512',
            ($payload['order_id'] ?? '').
            ($payload['status_code'] ?? '').
            ($payload['gross_amount'] ?? '').
            config('midtrans.server_key')
        );

        return hash_equals($expectedSignature, (string) ($payload['signature_key'] ?? ''));
    }

    public function isConfigured(): bool
    {
        return filled(config('midtrans.server_key')) && filled(config('midtrans.client_key'));
    }
}
