<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendPatientOtpJob;
use App\Services\PatientOtpService;
use App\Services\WhatsAppService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        if ($request->user()->role === 'patient') {
            $otp = app(PatientOtpService::class)->issueFor($request->user());

            SendPatientOtpJob::dispatch($request->user(), $otp);

            $redirect = back()->with('status', 'otp-sent');

            if (app(WhatsAppService::class)->shouldExposeDebugOtp()) {
                $redirect->with('otp_debug_code', $otp);
            }

            return $redirect;
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }
}
