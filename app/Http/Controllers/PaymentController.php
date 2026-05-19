<?php

namespace App\Http\Controllers;

use App\Jobs\SendBookingNotificationJob;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\MeetingLinkService;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function showConsultationCheckout(Request $request, Booking $booking, MidtransService $midtransService): Response
    {
        abort_unless($booking->user_id === $request->user()->id, 403);

        $booking->load(['doctor.user', 'slot', 'payment']);

        $eligibleForCheckout = $this->bookingIsEligibleForCheckout($booking, $request->user()->id);

        abort_unless($eligibleForCheckout || $booking->payment, 404);

        $payment = $eligibleForCheckout
            ? $this->prepareConsultationPayment($booking, $midtransService)
            : $booking->payment;

        abort_unless($payment instanceof Payment, 404);

        $booking = $booking->fresh(['doctor.user', 'slot']);

        return Inertia::render('Patient/Checkout', $this->buildCheckoutPayload($booking, $payment, $eligibleForCheckout));
    }

    public function initConsultation(Request $request, MidtransService $midtransService): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
        ]);

        $booking = Booking::query()
            ->whereKey($data['booking_id'])
            ->where('user_id', $request->user()->id)
            ->with(['doctor.user', 'slot', 'payment'])
            ->firstOrFail();

        abort_unless($this->bookingIsEligibleForCheckout($booking, $request->user()->id), 404);

        $payment = $this->prepareConsultationPayment($booking, $midtransService);

        $booking = $booking->fresh(['doctor.user', 'slot']);

        return response()->json([
            'data' => $this->buildCheckoutPayload($booking, $payment, true),
        ]);
    }

    public function webhook(Request $request, MidtransService $midtransService, MeetingLinkService $meetingLinkService): JsonResponse
    {
        $payload = $request->all();

        abort_unless($midtransService->validateSignature($payload), 403, 'Invalid Midtrans signature.');

        $payment = Payment::query()
            ->where('midtrans_order_id', $payload['order_id'] ?? null)
            ->firstOrFail();

        abort_unless($midtransService->matchesAmount($payment, $payload), 422, 'Invalid Midtrans amount.');

        $outcome = $midtransService->determineConsultationOutcome($payload);

        match ($outcome) {
            'success' => $this->markPaymentSuccessful($payment, $payload, $meetingLinkService),
            'pending' => $this->markPaymentPending($payment, $payload),
            default => $this->markPaymentFailed($payment, $payload),
        };

        return response()->json(['message' => 'OK']);
    }

    public function simulate(Request $request, Payment $payment, MeetingLinkService $meetingLinkService): RedirectResponse
    {
        abort_unless(app()->environment(['local', 'testing']), 404);
        abort_unless($payment->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'status' => ['required', 'in:success,failed,pending'],
        ]);

        $payload = [
            'order_id' => $payment->midtrans_order_id,
            'transaction_status' => match ($data['status']) {
                'success' => 'settlement',
                'failed' => 'expire',
                default => 'pending',
            },
            'gross_amount' => (string) $payment->amount,
            'status_code' => '200',
        ];

        match ($data['status']) {
            'success' => $this->markPaymentSuccessful($payment, $payload, $meetingLinkService),
            'failed' => $this->markPaymentFailed($payment, $payload),
            default => $this->markPaymentPending($payment, $payload),
        };

        return redirect()
            ->route('patient.checkout', $payment->booking_id)
            ->with('success', 'Payment simulation completed.');
    }

    private function prepareConsultationPayment(Booking $booking, MidtransService $midtransService): Payment
    {
        $approvedAmount = $this->consultationFee();
        $payment = $booking->payment;

        if ($payment?->status === 'pending' && $payment->amount !== $approvedAmount) {
            $payment->update([
                'status' => 'failed',
                'payload' => $this->appendProviderPayload($payment, [
                    'event' => 'payment_replaced',
                    'reason' => 'consultation_amount_mismatch',
                    'expected_amount' => $approvedAmount,
                    'previous_amount' => $payment->amount,
                ]),
            ]);

            $payment = null;
        }

        if (! $payment || $payment->status === 'failed') {
            $attemptNumber = ((int) $booking->payments()->max('attempt_number')) + 1;

            $payment = Payment::create([
                'user_id' => $booking->user_id,
                'booking_id' => $booking->id,
                'attempt_number' => $attemptNumber,
                'amount' => $approvedAmount,
                'provider' => 'midtrans',
                'midtrans_order_id' => $this->makeConsultationOrderId($booking, $attemptNumber),
                'status' => 'pending',
            ]);
        }

        if (blank($payment->snap_token) && $payment->status === 'pending') {
            $transaction = $midtransService->createConsultationTransaction($payment);

            $payment->update(['snap_token' => $transaction['token']]);
        }

        return $payment->fresh();
    }

    private function markPaymentPending(Payment $payment, array $payload): void
    {
        DB::transaction(function () use ($payment, $payload): void {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            $payment->update([
                'payload' => $this->appendProviderPayload($payment, $payload),
            ]);
        });
    }

    private function markPaymentSuccessful(Payment $payment, array $payload, MeetingLinkService $meetingLinkService): void
    {
        DB::transaction(function () use ($payment, $payload, $meetingLinkService): void {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status !== 'pending') {
                $payment->update(['payload' => $this->appendProviderPayload($payment, $payload)]);

                return;
            }

            $booking = $payment->booking()->with(['slot', 'doctor.user', 'patient'])->firstOrFail();

            if ($booking->status !== 'pending') {
                $payment->update(['payload' => $this->appendProviderPayload($payment, $payload)]);

                return;
            }

            $meetingLink = $booking->meeting_link ?: $meetingLinkService->createForBooking($booking);

            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payload' => $this->appendProviderPayload($payment, $payload),
            ]);

            $booking->update([
                'status' => 'confirmed',
                'meeting_link' => $meetingLink,
            ]);

            $booking->slot()->update([
                'status' => 'booked',
                'locked_until' => null,
                'locked_by_user_id' => null,
            ]);

            SendBookingNotificationJob::dispatch($booking, 'confirmation');
        });
    }

    private function markPaymentFailed(Payment $payment, array $payload): void
    {
        DB::transaction(function () use ($payment, $payload): void {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status === 'paid') {
                $payment->update(['payload' => $this->appendProviderPayload($payment, $payload)]);

                return;
            }

            if ($payment->status === 'failed') {
                $payment->update(['payload' => $this->appendProviderPayload($payment, $payload)]);

                return;
            }

            $payment->update([
                'status' => 'failed',
                'payload' => $this->appendProviderPayload($payment, $payload),
            ]);

            $booking = $payment->booking()->with('slot')->first();

            if (! $booking || $booking->status !== 'pending') {
                return;
            }

            $booking->update(['status' => 'cancelled']);

            $booking->slot()->update([
                'status' => 'available',
                'locked_until' => null,
                'locked_by_user_id' => null,
            ]);
        });
    }

    private function buildCheckoutPayload(Booking $booking, Payment $payment, bool $canContinueCheckout): array
    {
        return [
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'doctor' => $booking->doctor->user->name,
                'specialization' => $booking->doctor->specialization,
                'start_time' => $booking->slot->start_time,
                'notes' => $booking->notes,
                'meeting_link' => $booking->meeting_link,
            ],
            'payment' => [
                'id' => $payment->id,
                'attempt_number' => $payment->attempt_number,
                'amount' => $payment->amount,
                'status' => $payment->status,
                'snap_token' => $canContinueCheckout ? $payment->snap_token : null,
                'order_id' => $payment->midtrans_order_id,
                'can_continue_checkout' => $canContinueCheckout && $payment->status === 'pending',
            ],
            'midtrans' => [
                'client_key' => config('midtrans.client_key'),
                'is_production' => (bool) config('midtrans.is_production'),
                'is_demo' => $canContinueCheckout && str_starts_with((string) $payment->snap_token, 'demo-'),
            ],
        ];
    }

    private function bookingIsEligibleForCheckout(Booking $booking, int $userId): bool
    {
        return $booking->user_id === $userId
            && $booking->status === 'pending'
            && $booking->slot !== null
            && $booking->slot->status === 'locked'
            && $booking->slot->locked_by_user_id === $userId
            && $booking->slot->locked_until?->isFuture();
    }

    private function consultationFee(): int
    {
        return (int) config('clinic.consultation_fee', 500000);
    }

    private function makeConsultationOrderId(Booking $booking, int $attemptNumber): string
    {
        return sprintf('CONSULT-%d-%d-%s', $booking->id, $attemptNumber, Str::upper(Str::random(6)));
    }

    private function appendProviderPayload(Payment $payment, array $payload): array
    {
        $existingPayload = is_array($payment->payload) ? $payment->payload : [];
        $history = data_get($existingPayload, 'history', []);

        if ($history === [] && $existingPayload !== []) {
            $history[] = [
                'received_at' => now()->toIso8601String(),
                'payload' => $existingPayload,
            ];
        }

        $history[] = [
            'received_at' => now()->toIso8601String(),
            'payload' => $payload,
        ];

        return [
            'latest' => $payload,
            'history' => $history,
        ];
    }
}
