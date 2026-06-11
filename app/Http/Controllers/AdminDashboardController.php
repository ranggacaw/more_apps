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
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'booking_search' => ['nullable', 'string', 'max:120'],
            'payment_search' => ['nullable', 'string', 'max:120'],
            'booking_sort_by' => ['nullable', Rule::in(['patient', 'doctor', 'start_time', 'status', 'payment_status'])],
            'booking_sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
            'payment_sort_by' => ['nullable', Rule::in(['patient', 'type', 'source', 'amount', 'status'])],
            'payment_sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $bookingSearch = trim((string) ($filters['booking_search'] ?? ''));
        $paymentSearch = trim((string) ($filters['payment_search'] ?? ''));
        $bookingSortBy = $filters['booking_sort_by'] ?? null;
        $bookingSortDir = $filters['booking_sort_dir'] ?? 'desc';
        $paymentSortBy = $filters['payment_sort_by'] ?? null;
        $paymentSortDir = $filters['payment_sort_dir'] ?? 'desc';

        $recentBookingsQuery = Booking::query()
            ->with(['patient', 'doctor.user', 'slot', 'payment'])
            ->when($bookingSearch !== '', fn (Builder $query) => $this->filterBookingsByPatientName($query, $bookingSearch));

        $this->sortRecentBookings($recentBookingsQuery, $bookingSortBy, $bookingSortDir);

        $recentBookings = $recentBookingsQuery
            ->paginate(10, ['*'], 'bookings_page')
            ->withQueryString();

        $recentPaymentsQuery = Payment::query()
            ->with(['user', 'booking.patient', 'booking.doctor.user', 'booking.slot', 'package', 'queueEntry.doctor.user', 'consultation'])
            ->when($paymentSearch !== '', fn (Builder $query) => $this->filterPaymentsByPatientName($query, $paymentSearch));

        $this->sortRecentPayments($recentPaymentsQuery, $paymentSortBy, $paymentSortDir);

        $recentPayments = $recentPaymentsQuery
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
                'sortBy' => $bookingSortBy,
                'sortDir' => $bookingSortDir,
            ],
            'paymentTable' => [
                'data' => $this->mapPayments($recentPayments),
                'meta' => $this->paginationMeta($recentPayments),
                'filters' => [
                    'search' => $paymentSearch,
                ],
                'sortBy' => $paymentSortBy,
                'sortDir' => $paymentSortDir,
            ],
        ]);
    }

    private function sortRecentBookings(Builder $query, ?string $sortBy, string $sortDir): void
    {
        match ($sortBy) {
            'patient' => $query
                ->leftJoin('users as booking_patients', 'bookings.user_id', '=', 'booking_patients.id')
                ->select('bookings.*')
                ->orderByRaw("LOWER(COALESCE(booking_patients.name, bookings.guest_patient_name, 'Guest Patient')) {$sortDir}"),
            'doctor' => $query
                ->leftJoin('doctors as booking_doctors', 'bookings.doctor_id', '=', 'booking_doctors.id')
                ->leftJoin('users as booking_doctor_users', 'booking_doctors.user_id', '=', 'booking_doctor_users.id')
                ->select('bookings.*')
                ->orderByRaw("LOWER(COALESCE(booking_doctor_users.name, '')) {$sortDir}"),
            'start_time' => $query
                ->leftJoin('time_slots as booking_slots', 'bookings.slot_id', '=', 'booking_slots.id')
                ->select('bookings.*')
                ->orderBy('booking_slots.start_time', $sortDir),
            'status' => $query->orderBy('bookings.status', $sortDir),
            'payment_status' => $query->orderByRaw("LOWER(COALESCE((SELECT status FROM payments WHERE payments.booking_id = bookings.id ORDER BY payments.id DESC LIMIT 1), '')) {$sortDir}"),
            default => $query->latest('bookings.id'),
        };

        if ($sortBy) {
            $query->orderBy('bookings.id', 'desc');
        }
    }

    private function sortRecentPayments(Builder $query, ?string $sortBy, string $sortDir): void
    {
        match ($sortBy) {
            'patient' => $query
                ->leftJoin('users as payment_users', 'payments.user_id', '=', 'payment_users.id')
                ->leftJoin('bookings as payment_bookings', 'payments.booking_id', '=', 'payment_bookings.id')
                ->leftJoin('users as payment_booking_patients', 'payment_bookings.user_id', '=', 'payment_booking_patients.id')
                ->leftJoin('clinic_queue_entries as payment_queue_entries', 'payments.queue_entry_id', '=', 'payment_queue_entries.id')
                ->select('payments.*')
                ->orderByRaw("LOWER(COALESCE(payment_users.name, payment_booking_patients.name, payment_bookings.guest_patient_name, payment_queue_entries.patient_name, 'Guest patient')) {$sortDir}"),
            'type' => $query->orderBy('payments.type', $sortDir),
            'source' => $query
                ->leftJoin('clinic_queue_entries as payment_source_queue_entries', 'payments.queue_entry_id', '=', 'payment_source_queue_entries.id')
                ->select('payments.*')
                ->orderByRaw("LOWER(CASE WHEN payments.queue_entry_id IS NOT NULL THEN COALESCE(payment_source_queue_entries.queue_number, '') WHEN payments.booking_id IS NOT NULL THEN CAST(payments.booking_id AS TEXT) ELSE COALESCE(CAST(payments.consultation_id AS TEXT), '') END) {$sortDir}"),
            'amount' => $query->orderBy('payments.amount', $sortDir),
            'status' => $query->orderBy('payments.status', $sortDir),
            default => $query->latest('payments.id'),
        };

        if ($sortBy) {
            $query->orderBy('payments.id', 'desc');
        }
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
