<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\UserPackage;
use App\Services\ClinicAssetService;
use App\Services\PackageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminCheckInController extends Controller
{
    public function store(Request $request, UserPackage $userPackage, PackageService $packageService, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        $data = $request->validate([
            'booking_id' => ['nullable', 'integer', 'exists:bookings,id'],
            'consultation_id' => ['nullable', 'integer', 'exists:consultations,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'supporting_document' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $booking = isset($data['booking_id'])
            ? Booking::query()->findOrFail($data['booking_id'])
            : null;

        if ($booking) {
            abort_unless($booking->user_id === $userPackage->user_id, 422, 'The booking does not belong to the selected package owner.');
        }

        $checkIn = $packageService->recordCheckIn($userPackage, [
            'booking' => $booking,
            'consultation_id' => $data['consultation_id'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        if ($request->hasFile('supporting_document')) {
            $checkIn->update([
                'supporting_document_path' => $clinicAssetService->storeCheckInDocument($checkIn, $request->file('supporting_document')),
            ]);
        }

        return back()->with('success', 'Check-in recorded.');
    }
}
