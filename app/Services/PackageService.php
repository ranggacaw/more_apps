<?php

namespace App\Services;

use App\Jobs\SendUserPackageNotificationJob;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserPackage;
use Illuminate\Support\Facades\DB;

class PackageService
{
    public function activatePackage(User $user, Package $package, ?Payment $payment = null): UserPackage
    {
        return DB::transaction(function () use ($user, $package, $payment): UserPackage {
            $userPackage = UserPackage::create([
                'user_id' => $user->id,
                'package_id' => $package->id,
                'payment_id' => $payment?->id,
                'status' => 'active',
                'consultation_credits_total' => $package->consultation_credits,
                'consultation_credits_remaining' => $package->consultation_credits,
                'activated_at' => now(),
            ]);

            SendUserPackageNotificationJob::dispatch($userPackage, 'activation');

            return $userPackage;
        });
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
}
