<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $bookings = $user->bookings()
            ->with(['doctor.user', 'slot', 'payment'])
            ->latest()
            ->take(6)
            ->get();

        return Inertia::render('Patient/Dashboard', [
            'stats' => [
                'totalBookings' => $user->bookings()->count(),
                'confirmedBookings' => $user->bookings()->where('status', 'confirmed')->count(),
                'paidBookings' => $user->payments()->where('status', 'paid')->count(),
            ],
            'bookings' => $bookings->map(fn ($booking) => [
                'id' => $booking->id,
                'status' => $booking->status,
                'doctor' => $booking->doctor->user->name,
                'specialization' => $booking->doctor->specialization,
                'start_time' => $booking->slot->start_time,
                'meeting_link' => $booking->meeting_link,
                'payment_status' => $booking->payment?->status,
            ]),
        ]);
    }
}
