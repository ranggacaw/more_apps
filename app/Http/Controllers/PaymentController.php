<?php

namespace App\Http\Controllers;

use App\Jobs\SendBookingNotificationJob;
use App\Models\Booking;
use App\Models\Package;
use App\Models\Payment;
use App\Models\TimeSlot;
use App\Models\User;
use App\Services\MeetingLinkService;
use App\Services\MidtransService;
use App\Services\PackageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function storeBooking(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'doctor_id' => ['required', 'integer', 'exists:doctors,id'],
            'slot_id' => ['required', 'integer', 'exists:time_slots,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = DB::transaction(function () use ($request, $data): Booking {
            $slot = TimeSlot::query()->lockForUpdate()->findOrFail($data['slot_id']);

            abort_unless(
                $slot->doctor_id === (int) $data['doctor_id']
                && $slot->status === 'locked'
                && $slot->locked_by_user_id === $request->user()->id
                && $slot->locked_until?->isFuture(),
                422,
                'Selected slot is not available for checkout.',
            );

            $booking = Booking::create([
                'user_id' => $request->user()->id,
                'doctor_id' => $slot->doctor_id,
                'slot_id' => $slot->id,
                'status' => 'pending',
                'booking_source' => 'self_service',
                'consultation_mode' => 'online',
                'notes' => $data['notes'] ?? null,
            ]);

            $slot->update([
                'status' => 'booked',
                'locked_by_user_id' => null,
                'locked_until' => null,
            ]);

            return $booking;
        });

        return redirect()->route('patient.checkout', $booking);
    }

    public function showConsultationCheckout(Request $request, Booking $booking, MidtransService $midtransService, MeetingLinkService $meetingLinkService): Response
    {
        abort_unless($booking->user_id === $request->user()->id, 403);

        $booking->load(['doctor.user', 'slot', 'payment']);

        $eligibleForCheckout = $this->bookingIsEligibleForCheckout($booking, $request->user()->id);

        abort_unless($eligibleForCheckout || $booking->payment, 404);

        $payment = $eligibleForCheckout
            ? $this->prepareConsultationPayment($booking, $midtransService)
            : $booking->payment;

        abort_unless($payment instanceof Payment, 404);

        if ($payment->status === 'paid' && $booking->status === 'confirmed') {
            $meetingLink = $meetingLinkService->ensureJoinableForBooking($booking);

            if ($meetingLink !== $booking->meeting_link) {
                $booking->update(['meeting_link' => $meetingLink]);
            }
        }

        $booking = $booking->fresh(['doctor.user', 'slot']);

        return Inertia::render('Patient/Checkout', $this->buildCheckoutPayload($booking, $payment, $eligibleForCheckout));
    }

    public function showPackageCatalog(Request $request, PackageService $packageService): Response
    {
        $user = $request->user();
        $packages = Package::query()
            ->where('is_active', true)
            ->orderBy('price')
            ->orderBy('name')
            ->get();

        $creditState = $packageService->consultationCreditState($user);
        $latestPayment = $user->payments()
            ->with('package')
            ->where('type', 'package')
            ->latest()
            ->first();

        return Inertia::render('Patient/Packages', [
            'credit' => $this->buildCreditPayload($creditState),
            'packages' => $packages->map(fn (Package $package) => [
                'id' => $package->id,
                'name' => $package->name,
                'description' => $package->description,
                'price' => $package->price,
                'consultation_credits' => $package->consultation_credits,
                'checkout' => $this->buildPackagePricingPayload($package, $creditState),
            ])->values(),
            'packageCheckout' => $latestPayment ? $this->buildPackageCheckoutPayload($latestPayment) : null,
            'midtrans' => $this->buildMidtransPayload(),
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

        abort_unless($this->bookingIsEligibleForCheckout($booking, $request->user()->id), 404);

        $payment = $this->prepareConsultationPayment($booking, $midtransService);

        $booking = $booking->fresh(['doctor.user', 'slot']);

        return response()->json([
            'data' => $this->buildCheckoutPayload($booking, $payment, true),
        ]);
    }

    public function initPackage(Request $request, MidtransService $midtransService, PackageService $packageService): JsonResponse
    {
        $data = $request->validate([
            'package_id' => ['required', 'integer', 'exists:packages,id'],
        ]);

        $user = $request->user();
        $package = Package::query()->whereKey($data['package_id'])->where('is_active', true)->firstOrFail();

        $creditState = $packageService->consultationCreditState($user, $package);
        abort_unless($creditState['eligible'], 422, $this->packageEligibilityMessage($creditState['reason']));

        $pricing = $this->buildPackagePricingPayload($package, $creditState);

        if ($pricing['final_amount'] === 0) {
            $payment = $this->completeZeroBalancePackageCheckout($user, $package, $packageService);

            return response()->json([
                'data' => $this->buildPackageCheckoutPayload($payment),
            ]);
        }

        $payment = $this->preparePackagePayment($user, $package, $creditState, $midtransService);

        return response()->json([
            'data' => $this->buildPackageCheckoutPayload($payment),
        ]);
    }

    public function webhook(Request $request, MidtransService $midtransService, MeetingLinkService $meetingLinkService, PackageService $packageService): JsonResponse
    {
        $payload = $request->all();

        abort_unless($midtransService->validateSignature($payload), 403, 'Invalid Midtrans signature.');

        $payment = Payment::query()
            ->where('midtrans_order_id', $payload['order_id'] ?? null)
            ->firstOrFail();

        abort_unless($payment->provider === 'midtrans', 404, 'Payment is not provider-backed.');

        abort_unless($midtransService->matchesAmount($payment, $payload), 422, 'Invalid Midtrans amount.');

        $outcome = $midtransService->determinePaymentOutcome($payload);

        match ($outcome) {
            'success' => $payment->type === 'package'
                ? $this->markPackagePaymentSuccessful($payment, $payload, $packageService)
                : $this->markConsultationPaymentSuccessful($payment, $payload, $meetingLinkService),
            'pending' => $this->markPaymentPending($payment, $payload),
            default => $payment->type === 'package'
                ? $this->markPackagePaymentFailed($payment, $payload)
                : $this->markConsultationPaymentFailed($payment, $payload),
        };

        return response()->json(['message' => 'OK']);
    }

    public function simulate(Request $request, Payment $payment, MeetingLinkService $meetingLinkService, PackageService $packageService): RedirectResponse
    {
        abort_unless(app()->environment(['local', 'testing']), 404);
        abort_unless($payment->user_id === $request->user()->id, 403);
        abort_unless($payment->provider === 'midtrans', 404);

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
            'success' => $payment->type === 'package'
                ? $this->markPackagePaymentSuccessful($payment, $payload, $packageService)
                : $this->markConsultationPaymentSuccessful($payment, $payload, $meetingLinkService),
            'failed' => $payment->type === 'package'
                ? $this->markPackagePaymentFailed($payment, $payload)
                : $this->markConsultationPaymentFailed($payment, $payload),
            default => $this->markPaymentPending($payment, $payload),
        };

        return redirect()->route('dashboard')->with('success', 'Payment simulation completed.');
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
                'type' => 'consultation',
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

    private function preparePackagePayment(User $user, Package $package, array $creditState, MidtransService $midtransService): Payment
    {
        $appliedCredit = min($creditState['credit_amount'], $package->price);
        $finalAmount = max($package->price - $appliedCredit, 0);

        $otherPendingPayment = $user->payments()
            ->where('type', 'package')
            ->where('status', 'pending')
            ->where(function ($query) use ($package, $creditState, $finalAmount, $appliedCredit): void {
                $query->where('package_id', '!=', $package->id)
                    ->orWhere('consultation_credit_source_payment_id', '!=', $creditState['source_payment_id'])
                    ->orWhere('amount', '!=', $finalAmount)
                    ->orWhere('consultation_credit_applied', '!=', $appliedCredit);
            })
            ->exists();

        abort_unless(! $otherPendingPayment, 422, 'Complete or fail your existing package checkout before starting another.');

        $payment = $user->payments()
            ->where('type', 'package')
            ->where('package_id', $package->id)
            ->where('consultation_credit_source_payment_id', $creditState['source_payment_id'])
            ->latest()
            ->first();

        if ($payment?->status === 'pending' && ($payment->amount !== $finalAmount || $payment->consultation_credit_applied !== $appliedCredit)) {
            $payment->update([
                'status' => 'failed',
                'payload' => $this->appendProviderPayload($payment, [
                    'event' => 'payment_replaced',
                    'reason' => 'package_amount_mismatch',
                    'expected_amount' => $finalAmount,
                    'expected_credit_applied' => $appliedCredit,
                ]),
            ]);

            $payment = null;
        }

        if (! $payment || $payment->status === 'failed') {
            $attemptNumber = ((int) $user->payments()
                ->where('type', 'package')
                ->where('package_id', $package->id)
                ->max('attempt_number')) + 1;

            $payment = Payment::create([
                'user_id' => $user->id,
                'booking_id' => null,
                'package_id' => $package->id,
                'attempt_number' => $attemptNumber,
                'type' => 'package',
                'amount' => $finalAmount,
                'consultation_credit_applied' => $appliedCredit,
                'consultation_credit_source_payment_id' => $creditState['source_payment_id'],
                'provider' => 'midtrans',
                'midtrans_order_id' => $this->makePackageOrderId($user, $package, $attemptNumber),
                'status' => 'pending',
            ]);
        }

        if (blank($payment->snap_token) && $payment->status === 'pending') {
            $transaction = $midtransService->createPackageTransaction($payment);

            $payment->update(['snap_token' => $transaction['token']]);
        }

        return $payment->fresh('package');
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

    private function markConsultationPaymentSuccessful(Payment $payment, array $payload, MeetingLinkService $meetingLinkService): void
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

            $meetingLink = $meetingLinkService->ensureJoinableForBooking($booking);

            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payload' => $this->appendProviderPayload($payment, $payload),
            ]);

            $booking->update([
                'status' => 'confirmed',
                'meeting_link' => $meetingLink,
            ]);

            $booking->patient->update([
                'consultation_credit' => $payment->amount,
                'consultation_credit_awarded_at' => now(),
                'consultation_credit_expires_at' => now()->addDays((int) config('clinic.consultation_credit_expires_days', 30)),
                'consultation_credit_consumed_at' => null,
                'consultation_credit_payment_id' => $payment->id,
            ]);

            $booking->slot()->update([
                'status' => 'booked',
                'locked_until' => null,
                'locked_by_user_id' => null,
            ]);

            SendBookingNotificationJob::dispatch($booking, 'confirmation');
        });
    }

    private function markPackagePaymentSuccessful(Payment $payment, array $payload, PackageService $packageService): void
    {
        DB::transaction(function () use ($payment, $payload, $packageService): void {
            $payment = Payment::query()->with('package')->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status !== 'pending') {
                $payment->update(['payload' => $this->appendProviderPayload($payment, $payload)]);

                return;
            }

            $user = User::query()->lockForUpdate()->findOrFail($payment->user_id);
            $creditState = $packageService->consultationCreditState($user, $payment->package, $payment->consultation_credit_source_payment_id);

            if (! $creditState['eligible']) {
                $payment->update([
                    'status' => 'failed',
                    'payload' => $this->appendProviderPayload($payment, [
                        ...$payload,
                        'package_checkout_rejected' => $creditState['reason'],
                    ]),
                ]);

                return;
            }

            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payload' => $this->appendProviderPayload($payment, $payload),
            ]);

            $this->consumeCreditAndActivatePackage($user, $payment, $packageService);
        });
    }

    private function markConsultationPaymentFailed(Payment $payment, array $payload): void
    {
        DB::transaction(function () use ($payment, $payload): void {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status === 'paid' || $payment->status === 'failed') {
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

    private function markPackagePaymentFailed(Payment $payment, array $payload): void
    {
        DB::transaction(function () use ($payment, $payload): void {
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($payment->status === 'paid' || $payment->status === 'failed') {
                $payment->update(['payload' => $this->appendProviderPayload($payment, $payload)]);

                return;
            }

            $payment->update([
                'status' => 'failed',
                'payload' => $this->appendProviderPayload($payment, $payload),
            ]);
        });
    }

    private function completeZeroBalancePackageCheckout(User $user, Package $package, PackageService $packageService): Payment
    {
        return DB::transaction(function () use ($user, $package, $packageService): Payment {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $creditState = $packageService->consultationCreditState($lockedUser, $package);

            abort_unless($creditState['eligible'], 422, $this->packageEligibilityMessage($creditState['reason']));

            $appliedCredit = min($creditState['credit_amount'], $package->price);
            abort_unless($package->price - $appliedCredit <= 0, 422, 'This package still requires a funded checkout.');

            $attemptNumber = ((int) $lockedUser->payments()
                ->where('type', 'package')
                ->where('package_id', $package->id)
                ->max('attempt_number')) + 1;

            $payment = Payment::create([
                'user_id' => $lockedUser->id,
                'booking_id' => null,
                'package_id' => $package->id,
                'attempt_number' => $attemptNumber,
                'type' => 'package',
                'amount' => 0,
                'consultation_credit_applied' => $appliedCredit,
                'consultation_credit_source_payment_id' => $creditState['source_payment_id'],
                'provider' => 'internal',
                'midtrans_order_id' => $this->makePackageOrderId($lockedUser, $package, $attemptNumber),
                'status' => 'paid',
                'paid_at' => now(),
                'payload' => [
                    'latest' => [
                        'event' => 'zero_balance_activation',
                        'package_id' => $package->id,
                    ],
                    'history' => [[
                        'received_at' => now()->toIso8601String(),
                        'payload' => [
                            'event' => 'zero_balance_activation',
                            'package_id' => $package->id,
                        ],
                    ]],
                ],
            ]);

            $this->consumeCreditAndActivatePackage($lockedUser, $payment->fresh('package'), $packageService);

            return $payment->fresh('package');
        });
    }

    private function consumeCreditAndActivatePackage(User $user, Payment $payment, PackageService $packageService): void
    {
        abort_unless($payment->package instanceof Package, 422, 'A valid package is required for activation.');

        $user->update([
            'consultation_credit' => 0,
            'consultation_credit_consumed_at' => now(),
        ]);

        $packageService->activatePackage($user, $payment->package, $payment, [
            'payment_type' => $payment->type,
            'package_price' => $payment->package->price,
            'consultation_credit_applied' => $payment->consultation_credit_applied,
            'final_amount_paid' => $payment->amount,
            'consultation_credit_source_payment_id' => $payment->consultation_credit_source_payment_id,
        ]);
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
            'midtrans' => $this->buildMidtransPayload($canContinueCheckout, $payment),
        ];
    }

    private function buildPackageCheckoutPayload(Payment $payment): array
    {
        $payment->loadMissing(['package', 'userPackage']);
        $canContinueCheckout = $payment->status === 'pending' && $payment->amount > 0;

        return [
            'package' => [
                'id' => $payment->package->id,
                'name' => $payment->package->name,
                'description' => $payment->package->description,
                'price' => $payment->package->price,
                'consultation_credits' => $payment->package->consultation_credits,
            ],
            'payment' => [
                'id' => $payment->id,
                'attempt_number' => $payment->attempt_number,
                'amount' => $payment->amount,
                'status' => $payment->status,
                'snap_token' => $canContinueCheckout ? $payment->snap_token : null,
                'order_id' => $payment->midtrans_order_id,
                'can_continue_checkout' => $canContinueCheckout,
                'consultation_credit_applied' => $payment->consultation_credit_applied,
                'type' => $payment->type,
            ],
            'user_package' => $payment->userPackage ? [
                'id' => $payment->userPackage->id,
                'status' => $payment->userPackage->status,
                'consultation_credits_remaining' => $payment->userPackage->consultation_credits_remaining,
            ] : null,
        ];
    }

    private function buildPackagePricingPayload(Package $package, array $creditState): array
    {
        $appliedCredit = $creditState['eligible']
            ? min($creditState['credit_amount'], $package->price)
            : 0;

        return [
            'applied_credit' => $appliedCredit,
            'final_amount' => max($package->price - $appliedCredit, 0),
            'is_eligible' => $creditState['eligible'],
            'eligibility_reason' => $creditState['reason'],
        ];
    }

    private function buildCreditPayload(array $creditState): array
    {
        return [
            'amount' => $creditState['credit_amount'],
            'is_eligible' => $creditState['eligible'],
            'eligibility_reason' => $creditState['reason'],
            'message' => $this->packageEligibilityMessage($creditState['reason']),
            'source_booking_id' => $creditState['source_booking_id'],
            'source_booking_status' => $creditState['source_booking_status'],
            'awarded_at' => $creditState['awarded_at'],
            'expires_at' => $creditState['expires_at'],
            'consumed_at' => $creditState['consumed_at'],
        ];
    }

    private function buildMidtransPayload(bool $canContinueCheckout = false, ?Payment $payment = null): array
    {
        return [
            'client_key' => config('midtrans.client_key'),
            'is_production' => (bool) config('midtrans.is_production'),
            'is_demo' => $canContinueCheckout && $payment !== null && str_starts_with((string) $payment->snap_token, 'demo-'),
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

    private function makePackageOrderId(User $user, Package $package, int $attemptNumber): string
    {
        return sprintf('PACKAGE-%d-%d-%d-%s', $user->id, $package->id, $attemptNumber, Str::upper(Str::random(6)));
    }

    private function packageEligibilityMessage(string $reason): string
    {
        return match ($reason) {
            'eligible' => 'Your consultation credit is ready for package checkout.',
            'consultation_incomplete' => 'Package checkout is only available after the qualifying consultation is completed.',
            'expired' => 'Your consultation credit has expired and can no longer be used for package checkout.',
            'consumed' => 'Your consultation credit has already been used for a package purchase.',
            'invalid_source' => 'Your consultation credit could not be linked to a qualifying paid consultation.',
            default => 'A paid consultation credit is required before package checkout becomes available.',
        };
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
