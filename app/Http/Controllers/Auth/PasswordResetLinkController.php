<?php

namespace App\Http\Controllers\Auth;

use App\Jobs\SendPatientPasswordRecoveryJob;
use App\Http\Controllers\Controller;
use App\Services\PatientAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|string|max:255',
        ]);

        $identifier = trim((string) $request->input('email'));

        if (! str_contains($identifier, '@')) {
            RateLimiter::hit('patient-password-recovery:'.$request->ip().':'.$identifier, 300);

            if (RateLimiter::tooManyAttempts('patient-password-recovery:'.$request->ip().':'.$identifier, 5)) {
                return back()->with('status', 'If this patient account exists, recovery instructions will be sent shortly.');
            }

            $patient = app(PatientAccountService::class)->findPatientByPhone($identifier);

            if ($patient) {
                $token = Password::broker()->createToken($patient);
                $resetUrl = URL::route('password.reset', ['token' => $token, 'email' => $patient->email], false);

                SendPatientPasswordRecoveryJob::dispatch($patient->id, $resetUrl);
            }

            return back()->with('status', 'If this patient account exists, recovery instructions will be sent shortly.');
        }

        // We will send the password reset link to this user. Once we have attempted
        // to send the link, we will examine the response then see the message we
        // need to show to the user. Finally, we'll send out a proper response.
        $status = Password::sendResetLink(
            ['email' => $identifier]
        );

        if ($status == Password::RESET_LINK_SENT) {
            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
