<?php

namespace App\Http\Controllers;

use App\Models\ClinicQueueEntry;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminQueueController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Queue', $this->getQueueData());
    }

    public function api()
    {
        return response()->json($this->getQueueData());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_name' => 'required|string|max:255',
            'patient_phone' => 'nullable|string|max:50',
            'complaint_notes' => 'nullable|string',
        ]);

        $validated['status'] = 'waiting';
        $validated['queued_at'] = now();
        $validated['queue_number'] = ClinicQueueEntry::generateNextQueueNumber();

        ClinicQueueEntry::create($validated);

        return back()->with('success', 'Patient added to queue successfully.');
    }

    public function assign(Request $request, ClinicQueueEntry $entry)
    {
        if ($entry->status !== 'waiting') {
            return back()->withErrors(['error' => 'Only waiting patients can be assigned.']);
        }

        $validated = $request->validate([
            'doctor_id' => 'required|exists:doctors,id',
        ]);

        $doctor = Doctor::findOrFail($validated['doctor_id']);
        if (!$doctor->is_active) {
            return back()->withErrors(['error' => 'Doctor is not active.']);
        }

        $entry->update([
            'doctor_id' => $doctor->id,
            'status' => 'assigned',
            'assigned_at' => now(),
        ]);

        return back()->with('success', 'Patient assigned to doctor successfully.');
    }

    public function cancel(ClinicQueueEntry $entry)
    {
        if (!in_array($entry->status, ['waiting', 'assigned'])) {
            return back()->withErrors(['error' => 'Only waiting or assigned patients can be cancelled.']);
        }

        $entry->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return back()->with('success', 'Queue entry cancelled.');
    }

    private function getQueueData(): array
    {
        $entries = ClinicQueueEntry::active()
            ->with('doctor.user')
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($entry) {
                return [
                    'id' => $entry->id,
                    'queue_number' => $entry->queue_number,
                    'patient_name' => $entry->patient_name,
                    'patient_phone' => $entry->patient_phone,
                    'complaint_notes' => $entry->complaint_notes,
                    'doctor_id' => $entry->doctor_id,
                    'doctor_name' => $entry->doctor?->user?->name,
                    'status' => $entry->status,
                    'queued_at' => $entry->queued_at?->toIso8601String(),
                    'assigned_at' => $entry->assigned_at?->toIso8601String(),
                    'consultation_started_at' => $entry->consultation_started_at?->toIso8601String(),
                    'completed_at' => $entry->completed_at?->toIso8601String(),
                ];
            });

        $grouped = [
            'waiting' => $entries->where('status', 'waiting')->values(),
            'assigned' => $entries->where('status', 'assigned')->values(),
            'in_consultation' => $entries->where('status', 'in_consultation')->values(),
        ];

        $doctors = Doctor::with('user')
            ->where('is_active', true)
            ->get()
            ->map(function ($doctor) {
                $currentQueueEntry = ClinicQueueEntry::where('doctor_id', $doctor->id)
                    ->whereIn('status', ['assigned', 'in_consultation'])
                    ->orderBy('id', 'asc')
                    ->first();

                return [
                    'id' => $doctor->id,
                    'name' => $doctor->user->name,
                    'specialization' => $doctor->specialization,
                    'is_active' => $doctor->is_active,
                    'current_patient' => $currentQueueEntry ? [
                        'id' => $currentQueueEntry->id,
                        'queue_number' => $currentQueueEntry->queue_number,
                        'patient_name' => $currentQueueEntry->patient_name,
                        'status' => $currentQueueEntry->status,
                    ] : null,
                ];
            });

        return [
            'queue' => $grouped,
            'doctors' => $doctors,
        ];
    }
}
