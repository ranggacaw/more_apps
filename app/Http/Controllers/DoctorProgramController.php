<?php

namespace App\Http\Controllers;

use App\Jobs\SendUserPackageNotificationJob;
use App\Models\CheckIn;
use App\Services\ClinicAssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DoctorProgramController extends Controller
{
    public function review(Request $request, CheckIn $checkIn): RedirectResponse
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        $checkIn = $this->ownedProgramCheckIn($request, $checkIn);

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

    public function update(Request $request, CheckIn $checkIn, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        $checkIn = $this->ownedProgramCheckIn($request, $checkIn);

        $data = $request->validate([
            'weight_kg' => ['required', 'numeric', 'min:1', 'max:500'],
            'waist_cm' => ['required', 'numeric', 'min:1', 'max:500'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'review_notes' => ['nullable', 'string', 'max:2000'],
            'progress_photo' => ['nullable', 'image', 'max:5120'],
            'supporting_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $reviewNotes = trim((string) ($data['review_notes'] ?? ''));

        $checkIn->update([
            'doctor_id' => $reviewNotes !== '' ? $doctor->id : $checkIn->doctor_id,
            'weight_kg' => $data['weight_kg'],
            'waist_cm' => $data['waist_cm'],
            'notes' => $data['notes'] ?? null,
            'review_notes' => $reviewNotes !== '' ? $reviewNotes : null,
            'reviewed_at' => $reviewNotes !== ''
                ? ($checkIn->reviewed_at ?? now())
                : null,
        ]);

        if ($request->hasFile('progress_photo')) {
            $checkIn->update([
                'progress_photo_path' => $clinicAssetService->storeProgressPhoto($checkIn, $request->file('progress_photo')),
            ]);
        }

        if ($request->hasFile('supporting_document')) {
            $checkIn->update([
                'supporting_document_path' => $clinicAssetService->storeCheckInDocument($checkIn, $request->file('supporting_document')),
            ]);
        }

        if ($reviewNotes !== '') {
            SendUserPackageNotificationJob::dispatch($checkIn->userPackage, 'weekly-review-available', $checkIn->id);
        }

        return back()->with('success', 'Program progress updated.');
    }

    private function ownedProgramCheckIn(Request $request, CheckIn $checkIn): CheckIn
    {
        $doctor = $request->user()->doctorProfile()->firstOrFail();

        $checkIn->loadMissing('userPackage.sourceConsultation');

        abort_unless($checkIn->program_week !== null, 404);
        abort_unless($checkIn->userPackage?->sourceConsultation?->doctor_id === $doctor->id, 403);

        return $checkIn;
    }
}
