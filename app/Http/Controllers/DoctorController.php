<?php

namespace App\Http\Controllers;

use App\Models\Doctor;
use App\Services\ClinicAssetService;
use Illuminate\Http\JsonResponse;

class DoctorController extends Controller
{
    public function index(ClinicAssetService $clinicAssetService): JsonResponse
    {
        $doctors = Doctor::query()
            ->with('user')
            ->where('is_active', true)
            ->orderBy('id')
            ->get()
            ->map(fn ($doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
                'bio' => $doctor->bio,
                'avatar_url' => $clinicAssetService->temporaryAssetUrl($doctor->avatar_url, now()->addMinutes(30)),
                'consultation_fee' => $doctor->consultation_fee,
            ]);

        return response()->json(['data' => $doctors]);
    }
}
