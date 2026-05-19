<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PatientOtpService
{
    public const EXPIRATION_MINUTES = 10;

    public function issueFor(User $user): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'verification_otp' => Hash::make($otp),
            'verification_otp_expires_at' => now()->addMinutes(self::EXPIRATION_MINUTES),
        ])->save();

        return $otp;
    }

    public function otpHasExpired(User $user): bool
    {
        return blank($user->verification_otp)
            || blank($user->verification_otp_expires_at)
            || $user->verification_otp_expires_at->isPast();
    }

    public function otpMatches(User $user, string $otp): bool
    {
        return filled($user->verification_otp) && Hash::check($otp, $user->verification_otp);
    }

    public function clear(User $user): void
    {
        $user->forceFill([
            'verification_otp' => null,
            'verification_otp_expires_at' => null,
        ])->save();
    }
}
