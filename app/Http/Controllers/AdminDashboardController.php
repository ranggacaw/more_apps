<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): Response
    {
        $recentBookings = Booking::query()
            ->with(['patient', 'doctor.user', 'slot', 'payment'])
            ->latest()
            ->take(8)
            ->get();

        $paidRevenue = Payment::query()
            ->where('status', 'paid')
            ->sum('amount');

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'patients' => User::query()->where('role', 'patient')->count(),
                'doctors' => User::query()->where('role', 'doctor')->count(),
                'admins' => User::query()->where('role', 'admin')->count(),
                'revenue' => $paidRevenue,
            ],
            'recentBookings' => $recentBookings->map(fn ($booking) => [
                'id' => $booking->id,
                'patient' => $booking->patient->name,
                'doctor' => $booking->doctor->user->name,
                'status' => $booking->status,
                'payment_status' => $booking->payment?->status,
                'start_time' => $booking->slot->start_time,
            ]),
        ]);
    }
}
