<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserPackage;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): Response
    {
        $recentBookings = Booking::query()
            ->with(['patient', 'doctor.user', 'slot', 'payment'])
            ->latest()
            ->take(6)
            ->get();

        $recentPayments = Payment::query()
            ->with(['user', 'booking.doctor.user', 'booking.slot', 'package'])
            ->latest()
            ->take(6)
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
                'pending_bookings' => Booking::query()->where('status', 'pending')->count(),
                'confirmed_bookings' => Booking::query()->where('status', 'confirmed')->count(),
                'active_packages' => Package::query()->where('is_active', true)->count(),
                'active_entitlements' => UserPackage::query()->where('status', 'active')->count(),
            ],
            'recentBookings' => $recentBookings->map(fn ($booking) => [
                'id' => $booking->id,
                'patient' => $booking->patient->name,
                'doctor' => $booking->doctor->user->name,
                'status' => $booking->status,
                'payment_status' => $booking->payment?->status,
                'start_time' => $booking->slot->start_time,
            ])->values(),
            'recentPayments' => $recentPayments->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'patient' => $payment->user->name,
                'type' => $payment->type,
                'amount' => $payment->amount,
                'status' => $payment->status,
                'doctor' => $payment->booking?->doctor?->user?->name,
                'schedule' => $payment->booking?->slot?->start_time,
                'package' => $payment->package?->name,
                'paid_at' => $payment->paid_at,
                'created_at' => $payment->created_at,
            ])->values(),
        ]);
    }
}
