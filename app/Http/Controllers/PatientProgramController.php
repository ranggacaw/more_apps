<?php

namespace App\Http\Controllers;

use App\Models\UserPackage;
use App\Services\ClinicAssetService;
use App\Services\PackageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PatientProgramController extends Controller
{
    public function storeCheckIn(Request $request, UserPackage $userPackage, PackageService $packageService, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        $data = $request->validate([
            'weight_kg' => ['required', 'numeric', 'min:1', 'max:500'],
            'waist_cm' => ['required', 'numeric', 'min:1', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'progress_photo' => ['nullable', 'image', 'max:5120'],
        ]);

        $checkIn = $packageService->recordWeeklyProgressCheckIn($userPackage, $request->user(), $data);

        if ($request->hasFile('progress_photo')) {
            $checkIn->update([
                'progress_photo_path' => $clinicAssetService->storeProgressPhoto($checkIn, $request->file('progress_photo')),
            ]);
        }

        return back()->with('success', 'Weekly progress check-in submitted.');
    }
}
