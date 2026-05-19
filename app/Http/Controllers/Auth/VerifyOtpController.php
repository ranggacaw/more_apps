<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\PatientOtpService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class VerifyOtpController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        if ($user->role !== 'patient') {
            return redirect(route('verification.notice', absolute: false));
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
        }

        $otpService = app(PatientOtpService::class);

        if ($otpService->otpHasExpired($user)) {
            throw ValidationException::withMessages([
                'otp' => 'The verification code has expired. Request a new code and try again.',
            ]);
        }

        if (! $otpService->otpMatches($user, $validated['otp'])) {
            throw ValidationException::withMessages([
                'otp' => 'The verification code is invalid.',
            ]);
        }

        $user->forceFill([
            'email_verified_at' => Carbon::now(),
        ])->save();

        $otpService->clear($user);

        event(new Verified($user));

        return redirect()->intended(route('dashboard', absolute: false).'?verified=1');
    }
}
