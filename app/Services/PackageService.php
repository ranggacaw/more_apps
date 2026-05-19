<?php

namespace App\Services;

use App\Jobs\SendUserPackageNotificationJob;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserPackage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PackageService
{
    public function activatePackage(User $user, Package $package, ?Payment $payment = null, array $metadata = []): UserPackage
    {
        return DB::transaction(function () use ($user, $package, $payment, $metadata): UserPackage {
            $userPackage = UserPackage::create([
                'user_id' => $user->id,
                'package_id' => $package->id,
                'payment_id' => $payment?->id,
                'status' => 'active',
                'consultation_credits_total' => $package->consultation_credits,
                'consultation_credits_remaining' => $package->consultation_credits,
                'activated_at' => now(),
                'metadata' => $metadata === [] ? null : $metadata,
            ]);

            $payment?->consultationCreditSourcePayment?->booking?->consultation()?->update([
                'user_package_id' => $userPackage->id,
            ]);

            SendUserPackageNotificationJob::dispatch($userPackage, 'activation');

            return $userPackage;
        });
    }

    /**
     * @return array{
     *     credit_amount:int,
     *     eligible:bool,
     *     reason:string,
     *     applied_credit:int,
     *     source_payment_id:int|null,
     *     source_booking_id:int|null,
     *     source_booking_status:string|null,
     *     awarded_at:?string,
     *     expires_at:?string,
     *     consumed_at:?string
     * }
     */
    public function consultationCreditState(User $user, ?Package $package = null, ?int $expectedSourcePaymentId = null): array
    {
        $user->loadMissing('consultationCreditPayment.booking.consultation');

        $creditAmount = max((int) $user->consultation_credit, 0);
        $sourcePayment = $user->consultationCreditPayment;
        $sourceBooking = $sourcePayment?->booking;
        $consultation = $sourceBooking?->consultation;
        $isExpired = $user->consultation_credit_expires_at?->isPast() ?? false;
        $wasConsumed = $user->consultation_credit_consumed_at !== null;
        $sourceMatches = $expectedSourcePaymentId === null || $sourcePayment?->id === $expectedSourcePaymentId;
        $consultationCompleted = $sourceBooking?->status === 'completed' && $consultation?->completed_at !== null;

        $reason = 'eligible';

        if ($wasConsumed) {
            $reason = 'consumed';
        } elseif ($creditAmount === 0) {
            $reason = 'missing';
        } elseif ($isExpired) {
            $reason = 'expired';
        } elseif (! $sourcePayment || $sourcePayment->type !== 'consultation' || $sourcePayment->status !== 'paid' || ! $sourceMatches) {
            $reason = 'invalid_source';
        } elseif (! $consultationCompleted) {
            $reason = 'consultation_incomplete';
        }

        $eligible = $reason === 'eligible';

        return [
            'credit_amount' => $creditAmount,
            'eligible' => $eligible,
            'reason' => $reason,
            'applied_credit' => $eligible && $package ? min($creditAmount, $package->price) : 0,
            'source_payment_id' => $sourcePayment?->id,
            'source_booking_id' => $sourceBooking?->id,
            'source_booking_status' => $sourceBooking?->status,
            'awarded_at' => $user->consultation_credit_awarded_at?->toIso8601String(),
            'expires_at' => $user->consultation_credit_expires_at?->toIso8601String(),
            'consumed_at' => $user->consultation_credit_consumed_at?->toIso8601String(),
        ];
    }

    /**
     * @param  array{booking?: Booking|null, consultation_id?: int|null, notes?: string|null}  $attributes
     */
    public function recordCheckIn(UserPackage $userPackage, array $attributes = []): CheckIn
    {
        return DB::transaction(function () use ($userPackage, $attributes): CheckIn {
            $userPackage->refresh();

            abort_unless($userPackage->status === 'active', 422, 'The selected package is not active.');
            abort_unless($userPackage->consultation_credits_remaining > 0, 422, 'The selected package has no remaining consultation credits.');

            $remainingCredits = $userPackage->consultation_credits_remaining - 1;
            $booking = $attributes['booking'] ?? null;

            $checkIn = CheckIn::create([
                'user_package_id' => $userPackage->id,
                'booking_id' => $booking?->id,
                'consultation_id' => $attributes['consultation_id'] ?? null,
                'user_id' => $userPackage->user_id,
                'doctor_id' => $booking?->doctor_id,
                'notes' => $attributes['notes'] ?? null,
                'remaining_consultations_after' => $remainingCredits,
                'checked_in_at' => now(),
            ]);

            $userPackage->update([
                'consultation_credits_remaining' => $remainingCredits,
                'status' => $remainingCredits === 0 ? 'completed' : 'active',
            ]);

            return $checkIn;
        });
    }

    /**
     * @param  array{notes?: string|null, weight_kg: float|int|string, waist_cm: float|int|string}  $attributes
     */
    public function recordWeeklyProgressCheckIn(UserPackage $userPackage, User $patient, array $attributes): CheckIn
    {
        return DB::transaction(function () use ($userPackage, $patient, $attributes): CheckIn {
            $userPackage->refresh();
            $userPackage->loadMissing('sourceConsultation');

            abort_unless($userPackage->user_id === $patient->id, 403);
            abort_unless($userPackage->status === 'active', 422, 'The selected package is not active.');

            $currentWeek = $this->currentProgramWeek($userPackage);

            abort_unless(
                ! CheckIn::query()
                    ->where('user_package_id', $userPackage->id)
                    ->where('program_week', $currentWeek)
                    ->exists(),
                422,
                'This week\'s progress check-in has already been submitted for the selected package.',
            );

            return CheckIn::create([
                'user_package_id' => $userPackage->id,
                'consultation_id' => $userPackage->sourceConsultation?->id,
                'user_id' => $patient->id,
                'program_week' => $currentWeek,
                'weight_kg' => $attributes['weight_kg'],
                'waist_cm' => $attributes['waist_cm'],
                'notes' => $attributes['notes'] ?? null,
                'checked_in_at' => now(),
            ]);
        });
    }

    public function currentProgramWeek(UserPackage $userPackage, ?Carbon $reference = null): int
    {
        return $userPackage->currentProgramWeek($reference);
    }
}
