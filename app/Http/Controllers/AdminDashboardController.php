<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\ClinicQueueEntry;
use App\Models\Package;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserPackage;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $bookingSearch = trim((string) $request->query('booking_search', ''));
        $paymentSearch = trim((string) $request->query('payment_search', ''));

        $recentBookings = Booking::query()
            ->with(['patient', 'doctor.user', 'slot', 'payment'])
            ->when($bookingSearch !== '', fn (Builder $query) => $this->filterBookingsByPatientName($query, $bookingSearch))
            ->latest('id')
            ->paginate(10, ['*'], 'bookings_page')
            ->withQueryString();

        $recentPayments = Payment::query()
            ->with(['user', 'booking.patient', 'booking.doctor.user', 'booking.slot', 'package', 'queueEntry.doctor.user', 'consultation'])
            ->when($paymentSearch !== '', fn (Builder $query) => $this->filterPaymentsByPatientName($query, $paymentSearch))
            ->latest('id')
            ->paginate(10, ['*'], 'payments_page')
            ->withQueryString();

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
                'pending_treatment_handoffs' => Payment::query()
                    ->where('type', 'consultation_treatment')
                    ->where('provider', 'internal')
                    ->where('status', 'pending')
                    ->count(),
                'queue_summary' => [
                    'waiting' => $waitingQueueCount,
                    'active' => $activeQueueCount,
                ],
            ],
            'recentBookings' => $this->mapBookings($recentBookings),
            'recentPayments' => $this->mapPayments($recentPayments),
            'bookingTable' => [
                'data' => $this->mapBookings($recentBookings),
                'meta' => $this->paginationMeta($recentBookings),
                'filters' => [
                    'search' => $bookingSearch,
                ],
            ],
            'paymentTable' => [
                'data' => $this->mapPayments($recentPayments),
                'meta' => $this->paginationMeta($recentPayments),
                'filters' => [
                    'search' => $paymentSearch,
                ],
            ],
        ]);
    }

    private function filterBookingsByPatientName(Builder $query, string $search): void
    {
        $query->where(function (Builder $query) use ($search): void {
            $query
                ->whereRaw('LOWER(guest_patient_name) LIKE ?', [$this->searchLike($search)])
                ->orWhereHas('patient', fn (Builder $patientQuery) => $patientQuery->whereRaw('LOWER(name) LIKE ?', [$this->searchLike($search)]));
        });
    }

    private function filterPaymentsByPatientName(Builder $query, string $search): void
    {
        $query->where(function (Builder $query) use ($search): void {
            $query
                ->whereHas('user', fn (Builder $userQuery) => $userQuery->whereRaw('LOWER(name) LIKE ?', [$this->searchLike($search)]))
                ->orWhereHas('booking', fn (Builder $bookingQuery) => $bookingQuery->whereRaw('LOWER(guest_patient_name) LIKE ?', [$this->searchLike($search)]))
                ->orWhereHas('booking.patient', fn (Builder $patientQuery) => $patientQuery->whereRaw('LOWER(name) LIKE ?', [$this->searchLike($search)]))
                ->orWhereHas('queueEntry', fn (Builder $queueQuery) => $queueQuery->whereRaw('LOWER(patient_name) LIKE ?', [$this->searchLike($search)]));
        });
    }

    private function searchLike(string $search): string
    {
        return '%'.mb_strtolower($search).'%';
    }

    private function mapBookings(LengthAwarePaginator $bookings)
    {
        return $bookings->getCollection()->map(fn (Booking $booking) => [
            'id' => $booking->id,
            'patient' => $booking->patientDisplayName(),
            'doctor' => $booking->doctor->user->name,
            'status' => $booking->status,
            'payment_status' => $booking->payment?->status,
            'start_time' => $booking->slot->start_time,
        ])->values();
    }

    private function mapPayments(LengthAwarePaginator $payments)
    {
        return $payments->getCollection()->map(function (Payment $payment) {
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
                'provider' => $payment->provider,
                'paid_at' => $payment->paid_at,
                'created_at' => $payment->created_at,
                'can_mark_paid' => $isTreatmentHandoff && $payment->status === 'pending',
                'finalize_href' => $isTreatmentHandoff ? route('admin.payments.finalize-treatment', $payment, false) : null,
            ];
        })->values();
    }

    private function paginationMeta(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }
}
