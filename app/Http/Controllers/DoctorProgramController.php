<?php

namespace App\Http\Controllers;

use App\Jobs\SendUserPackageNotificationJob;
use App\Models\CheckIn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DoctorProgramController extends Controller
{
    public function review(Request $request, CheckIn $checkIn): RedirectResponse
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        $checkIn->loadMissing('userPackage.sourceConsultation');

        abort_unless($checkIn->program_week !== null, 404);
        abort_unless($checkIn->userPackage?->status === 'active', 422, 'The selected package is not active.');
        abort_unless($checkIn->userPackage?->sourceConsultation?->doctor_id === $doctor->id, 403);

        $data = $request->validate([
            'review_notes' => ['required', 'string', 'max:2000'],
        ]);

        $checkIn->update([
            'doctor_id' => $doctor->id,
            'review_notes' => $data['review_notes'],
            'reviewed_at' => now(),
        ]);

        SendUserPackageNotificationJob::dispatch($checkIn->userPackage, 'weekly-review-available', $checkIn->id);

        return back()->with('success', 'Weekly progress review saved.');
    }
}
