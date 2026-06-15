<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PatientPasswordChangeController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Auth/PatientPasswordChange');
    }

    public function update(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->role === 'patient', 403);

        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
            'must_change_password' => false,
        ]);

        return redirect()->route('patient.dashboard')->with('success', 'Password updated.');
    }
}
