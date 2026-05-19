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

        $payment = $this->prepareConsultationPayment($booking, $midtransService);

        return Inertia::render('Patient/Checkout', [
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'doctor' => $booking->doctor->user->name,
                'specialization' => $booking->doctor->specialization,
                'start_time' => $booking->slot->start_time,
                'notes' => $booking->notes,
            ],
            'payment' => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'status' => $payment->status,
                'snap_token' => $payment->snap_token,
                'order_id' => $payment->midtrans_order_id,
            ],
            'midtrans' => [
                'client_key' => config('midtrans.client_key'),
                'is_production' => config('midtrans.is_production'),
                'is_demo' => str_starts_with((string) $payment->snap_token, 'demo-'),
            ],
        ]);
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

        $payment = $this->prepareConsultationPayment($booking, $midtransService);

        return response()->json([
            'data' => [
                'id' => $payment->id,
                'snap_token' => $payment->snap_token,
                'amount' => $payment->amount,
                'status' => $payment->status,
            ],
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

        $status = $payload['transaction_status'] ?? 'pending';

        match ($status) {
            'settlement', 'capture' => $this->markPaymentSuccessful($payment, $payload, $meetingLinkService),
            'pending' => $payment->update(['payload' => $payload]),
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
            default => $payment->update(['payload' => $payload]),
        };

        return redirect()->route('patient.dashboard')->with('success', 'Payment simulation completed.');
    }

    private function prepareConsultationPayment(Booking $booking, MidtransService $midtransService): Payment
    {
        $payment = $booking->payment;

        if (! $payment || $payment->status === 'failed') {
            $payment = Payment::create([
                'user_id' => $booking->user_id,
                'booking_id' => $booking->id,
                'attempt_number' => ((int) $booking->payments()->max('attempt_number')) + 1,
                'amount' => $booking->doctor->consultation_fee,
                'provider' => 'midtrans',
                'midtrans_order_id' => 'CONSULT-'.$booking->id.'-'.Str::upper(Str::random(6)),
                'status' => 'pending',
            ]);
        }

        if (blank($payment->snap_token) && $payment->status === 'pending') {
            $transaction = $midtransService->createConsultationTransaction($payment);

            $payment->update(['snap_token' => $transaction['token']]);
        }

        return $payment->fresh();
    }

    private function markPaymentSuccessful(Payment $payment, array $payload, MeetingLinkService $meetingLinkService): void
    {
        DB::transaction(function () use ($payment, $payload, $meetingLinkService): void {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status !== 'pending') {
                $payment->update(['payload' => $payload]);

                return;
            }

            $booking = $payment->booking()->with(['slot', 'doctor.user', 'patient'])->firstOrFail();

            if ($booking->status !== 'pending') {
                $payment->update(['payload' => $payload]);

                return;
            }

            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payload' => $payload,
            ]);

            $booking->update([
                'status' => 'confirmed',
                'meeting_link' => $booking->meeting_link ?: $meetingLinkService->createForBooking($booking),
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
                return;
            }

            $payment->update([
                'status' => 'failed',
                'payload' => $payload,
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
}
