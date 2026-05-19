<?php

namespace App\Jobs;

use App\Models\WhatsAppBroadcast;
use App\Services\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Throwable;

class SendWhatsAppBroadcastJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $broadcastId)
    {
    }

    public function handle(WhatsAppService $whatsAppService): void
    {
        $broadcast = WhatsAppBroadcast::query()->find($this->broadcastId);

        if (! $broadcast) {
            return;
        }

        if (in_array($broadcast->status, ['completed', 'completed_with_failures', 'failed'], true)) {
            return;
        }

        $broadcast->update([
            'status' => 'processing',
            'started_at' => $broadcast->started_at ?? now(),
        ]);

        $sentCount = 0;
        $failedCount = 0;

        $deliveries = $broadcast->deliveries()
            ->where('status', 'pending')
            ->get();

        foreach ($deliveries as $delivery) {
            try {
                $whatsAppService->send($delivery->phone, $broadcast->message);

                $delivery->update([
                    'status' => 'sent',
                    'sent_at' => now(),
                    'error_message' => null,
                ]);

                $sentCount++;
            } catch (Throwable $exception) {
                $delivery->update([
                    'status' => 'failed',
                    'error_message' => mb_substr($exception->getMessage(), 0, 1000),
                ]);

                $failedCount++;
            }
        }

        $broadcast->update([
            'status' => match (true) {
                $sentCount === 0 && $failedCount > 0 => 'failed',
                $failedCount > 0 => 'completed_with_failures',
                default => 'completed',
            },
            'completed_at' => now(),
        ]);
    }
}
