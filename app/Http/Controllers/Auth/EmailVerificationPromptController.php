<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\WhatsAppService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        $whatsAppService = app(WhatsAppService::class);

        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended(route('dashboard', absolute: false))
                    : Inertia::render('Auth/VerifyEmail', [
                        'status' => session('status'),
                        'verificationChannel' => $request->user()->role === 'patient' ? 'otp' : 'email',
                        'phone' => $request->user()->phone,
                        'otpDeliveryMode' => $request->user()->role === 'patient'
                            ? ($whatsAppService->logsMessages() ? 'logged' : 'queued')
                            : null,
                        'otpDebugCode' => $whatsAppService->shouldExposeDebugOtp()
                            ? session('otp_debug_code')
                            : null,
                        'otpDebugEnabled' => $request->user()->role === 'patient' && $whatsAppService->shouldExposeDebugOtp(),
                    ]);
    }
}
