<?php

namespace App\Http\Controllers;

use App\Jobs\SendWhatsAppBroadcastJob;
use App\Models\User;
use App\Models\WhatsAppBroadcast;
use App\Models\WhatsAppBroadcastDelivery;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminBroadcastController extends Controller
{
    public function index(): Response
    {
        $broadcasts = WhatsAppBroadcast::query()
            ->with('requestedBy')
            ->withCount([
                'deliveries as sent_count' => fn ($query) => $query->where('status', 'sent'),
                'deliveries as failed_count' => fn ($query) => $query->where('status', 'failed'),
                'deliveries as pending_count' => fn ($query) => $query->where('status', 'pending'),
            ])
            ->latest()
            ->take(15)
            ->get();

        return Inertia::render('Admin/Broadcasts', [
            'audienceScopes' => collect(WhatsAppBroadcast::audienceOptions())
                ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
                ->values(),
            'broadcasts' => $broadcasts->map(fn (WhatsAppBroadcast $broadcast) => [
                'id' => $broadcast->id,
                'audience_scope' => $broadcast->audience_scope,
                'message' => $broadcast->message,
                'status' => $broadcast->status,
                'recipient_count' => $broadcast->recipient_count,
                'sent_count' => $broadcast->sent_count,
                'failed_count' => $broadcast->failed_count,
                'pending_count' => $broadcast->pending_count,
                'queued_at' => $broadcast->queued_at?->toIso8601String(),
                'started_at' => $broadcast->started_at?->toIso8601String(),
                'completed_at' => $broadcast->completed_at?->toIso8601String(),
                'requested_by' => $broadcast->requestedBy?->name,
            ])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'audience_scope' => ['required', Rule::in(array_keys(WhatsAppBroadcast::audienceOptions()))],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $broadcast = DB::transaction(function () use ($request, $data): WhatsAppBroadcast {
            $broadcast = WhatsAppBroadcast::create([
                'requested_by_user_id' => $request->user()->id,
                'audience_scope' => $data['audience_scope'],
                'message' => $data['message'],
                'status' => 'queued',
                'queued_at' => now(),
            ]);

            $recipients = $this->recipientQuery($data['audience_scope'])->get(['id', 'phone']);

            if ($recipients->isNotEmpty()) {
                WhatsAppBroadcastDelivery::query()->insert(
                    $recipients->map(fn (User $user) => [
                        'whatsapp_broadcast_id' => $broadcast->id,
                        'user_id' => $user->id,
                        'phone' => $user->phone,
                        'status' => 'pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])->all(),
                );
            }

            $broadcast->update([
                'recipient_count' => $recipients->count(),
                'status' => $recipients->isEmpty() ? 'completed' : 'queued',
                'completed_at' => $recipients->isEmpty() ? now() : null,
            ]);

            return $broadcast;
        });

        if ($broadcast->recipient_count > 0) {
            SendWhatsAppBroadcastJob::dispatch($broadcast->id);
        }

        return back()->with('success', 'Broadcast queued.');
    }

    private function recipientQuery(string $audienceScope)
    {
        return match ($audienceScope) {
            'verified_patients' => User::query()
                ->where('role', 'patient')
                ->whereNotNull('email_verified_at')
                ->whereNotNull('phone')
                ->where('phone', '!=', ''),
            'patients' => User::query()->where('role', 'patient')->whereNotNull('phone')->where('phone', '!=', ''),
            'doctors' => User::query()->where('role', 'doctor')->whereNotNull('phone')->where('phone', '!=', ''),
            'admins' => User::query()->where('role', 'admin')->whereNotNull('phone')->where('phone', '!=', ''),
            default => User::query()->whereNotNull('phone')->where('phone', '!=', ''),
        };
    }
}
