<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Services\ClinicAssetService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $doctorProfile = $request->user()?->doctorProfile;

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'role' => $request->user()->role,
            'doctorProfile' => $doctorProfile ? [
                'specialization' => $doctorProfile->specialization,
                'bio' => $doctorProfile->bio,
                'avatar_url' => $clinicAssetService->temporaryAssetUrl($doctorProfile->avatar_url, now()->addMinutes(30)),
                'has_avatar' => filled($doctorProfile->avatar_url),
            ] : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        if ($request->user()->role === 'doctor') {
            $doctorProfile = $request->user()->doctorProfile()->firstOrFail();

            if ($request->hasFile('avatar')) {
                $doctorProfile->update([
                    'avatar_url' => $clinicAssetService->storeDoctorAvatar($doctorProfile->id, $request->file('avatar')),
                ]);
            }
        }

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
