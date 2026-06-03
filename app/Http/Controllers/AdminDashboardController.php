<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\ClinicQueueEntry;
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
            ->latest('id')
            ->take(6)
            ->get();

        $recentPayments = Payment::query()
            ->with(['user', 'booking.patient', 'booking.doctor.user', 'booking.slot', 'package', 'queueEntry.doctor.user', 'consultation'])
            ->latest('id')
            ->take(6)
            ->get();

        $paidRevenue = Payment::query()
            ->where('status', 'paid')
            ->sum('amount');

        $waitingQueueCount = ClinicQueueEntry::where('status', 'waiting')->count();
        $activeQueueCount = ClinicQueueEntry::whereIn('status', ['assigned', 'in_consultation'])->count();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'patients' => Booking::query()->whereNotNull('user_id')->distinct('user_id')->count('user_id'),
                'doctors' => User::query()->where('role', 'doctor')->count(),
                'admins' => User::query()->where('role', 'admin')->count(),
                'revenue' => $paidRevenue,
                'pending_bookings' => Booking::query()->where('status', 'pending')->count(),
                'confirmed_bookings' => Booking::query()->where('status', 'confirmed')->count(),
                'active_packages' => Package::query()->where('is_active', true)->count(),
                'active_entitlements' => UserPackage::query()->where('status', 'active')->count(),
                'queue_summary' => [
                    'waiting' => $waitingQueueCount,
                    'active' => $activeQueueCount,
                ],
            ],
            'recentBookings' => $recentBookings->map(fn ($booking) => [
                'id' => $booking->id,
                'patient' => $booking->patientDisplayName(),
                'doctor' => $booking->doctor->user->name,
                'status' => $booking->status,
                'payment_status' => $booking->payment?->status,
                'start_time' => $booking->slot->start_time,
            ])->values(),
            'recentPayments' => $recentPayments->map(function (Payment $payment) {
                $isTreatmentHandoff = $payment->type === 'consultation_treatment' && $payment->provider === 'internal';

                return [
                    'id' => $payment->id,
                    'patient' => $payment->user?->name ?? $payment->booking?->patientDisplayName() ?? $payment->queueEntry?->patient_name ?? 'Guest patient',
                    'patient_phone' => $payment->user?->phone ?? $payment->booking?->patientContactPhone() ?? $payment->queueEntry?->patient_phone,
                    'type' => $payment->type,
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'doctor' => $payment->booking?->doctor?->user?->name ?? $payment->queueEntry?->doctor?->user?->name,
                    'schedule' => $payment->booking?->slot?->start_time,
                    'source' => $payment->queue_entry_id ? 'Walk-in queue '.$payment->queueEntry?->queue_number : ($payment->booking_id ? 'Booking #'.$payment->booking_id : 'Consultation #'.$payment->consultation_id),
                    'booking_id' => $payment->booking_id,
                    'queue_entry_id' => $payment->queue_entry_id,
                    'consultation_id' => $payment->consultation_id,
                    'package' => $payment->package?->name,
                    'paid_at' => $payment->paid_at,
                    'created_at' => $payment->created_at,
                    'can_mark_paid' => $isTreatmentHandoff && $payment->status === 'pending',
                    'finalize_href' => $isTreatmentHandoff ? route('admin.payments.finalize-treatment', $payment, false) : null,
                ];
            })->values(),
        ]);
    }
}
