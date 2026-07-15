<?php

namespace App\Http\Controllers;

use App\Jobs\SendBookingNotificationJob;
use App\Models\Booking;
use App\Models\ClinicOperatingHour;
use App\Models\Doctor;
use App\Models\Payment;
use App\Models\ScheduleOverrideLog;
use App\Models\TimeSlot;
use App\Models\User;
use App\Services\TimeSlotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminBookingController extends Controller
{
    public function index(Request $request): Response
    {
        $doctors = Doctor::query()
            ->with('user')
            ->where('is_active', true)
            ->orderBy('id')
            ->get();

        $patients = User::query()
            ->where(fn ($query) => $query->where('role', 'patient')->orWhereNull('role'))
            ->whereNotNull('email_verified_at')
            ->orderBy('name')
            ->get();

        $clinicSchedule = ClinicOperatingHour::query()
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Admin/Bookings', [
            'doctors' => $doctors->map(fn ($doctor) => [
                'id' => $doctor->id,
                'name' => $doctor->user->name,
                'specialization' => $doctor->specialization,
            ]),
            'patients' => $patients->map(fn ($patient) => [
                'id' => $patient->id,
                'name' => $patient->name,
                'phone' => $patient->phone,
                'email' => $patient->email,
            ]),
            'clinicSchedule' => $clinicSchedule->map(fn (ClinicOperatingHour $hour) => [
                'id' => $hour->id,
                'day_of_week' => $hour->day_of_week,
                'start_time' => substr((string) $hour->start_time, 0, 5),
                'end_time' => substr((string) $hour->end_time, 0, 5),
            ])->values(),
        ]);
    }

    public function slots(Request $request, TimeSlotService $timeSlotService): JsonResponse
    {
        $data = $request->validate([
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')->where('is_active', true)],
            'date' => ['required', 'date'],
            'include_outside_hours' => ['nullable', 'boolean'],
        ]);

        $doctor = Doctor::query()
            ->whereKey($data['doctor_id'])
            ->where('is_active', true)
            ->firstOrFail();

        $slots = $timeSlotService->getReservableSlotsForDoctorAndDate(
            $doctor,
            $data['date'],
            null,
            ! ($data['include_outside_hours'] ?? false),
        );

        return response()->json([
            'data' => $slots->map(fn ($slot) => [
                'id' => $slot->id,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'status' => $slot->status,
                'within_clinic_hours' => $timeSlotService->isSlotWithinClinicHours($slot),
            ]),
            'clinic_hours' => $timeSlotService->clinicHoursPayloadForDate($data['date']),
        ]);
    }

    public function show(Booking $booking): Response
    {
        $booking->load([
            'patient',
            'bookedByAdmin',
            'doctor.user',
            'slot',
            'payment',
            'payments' => fn ($query) => $query->latest('id'),
            'queueEntry',
        ]);

        $overrideLog = ScheduleOverrideLog::query()
            ->where('booking_id', $booking->id)
            ->latest('id')
            ->first();

        return Inertia::render('Admin/BookingDetail', [
            'booking' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'booking_source' => $booking->booking_source,
                'consultation_mode' => $booking->consultation_mode,
                'notes' => $booking->notes,
                'meeting_link' => $booking->meeting_link,
                'meeting_link_requested_at' => $booking->meeting_link_requested_at?->toIso8601String(),
                'meeting_link_submitted_at' => $booking->meeting_link_submitted_at?->toIso8601String(),
                'day_before_reminder_sent_at' => $booking->day_before_reminder_sent_at?->toIso8601String(),
                'same_day_reminder_sent_at' => $booking->same_day_reminder_sent_at?->toIso8601String(),
                'no_show_at' => $booking->no_show_at?->toIso8601String(),
                'created_at' => $booking->created_at?->toIso8601String(),
                'updated_at' => $booking->updated_at?->toIso8601String(),
                'is_guest_booking' => $booking->isGuestBooking(),
                'is_admin_assisted' => $booking->isAdminAssisted(),
                'needs_meeting_link' => $booking->needsMeetingLink(),
                'display_name' => $booking->patientDisplayName(),
                'display_phone' => $booking->patientContactPhone(),
                'display_email' => $booking->patientContactEmail(),
                'patient' => $booking->patient ? [
                    'id' => $booking->patient->id,
                    'name' => $booking->patient->name,
                    'phone' => $booking->patient->phone,
                    'email' => $booking->patient->email,
                ] : null,
                'guest_patient_name' => $booking->guest_patient_name,
                'guest_whatsapp' => $booking->guest_whatsapp,
                'doctor' => [
                    'id' => $booking->doctor->id,
                    'name' => $booking->doctor->user?->name ?? 'Unknown doctor',
                    'specialization' => $booking->doctor->specialization,
                    'is_active' => $booking->doctor->is_active,
                ],
                'slot' => [
                    'id' => $booking->slot->id,
                    'start_time' => $booking->slot->start_time,
                    'end_time' => $booking->slot->end_time,
                ],
                'booked_by_admin' => $booking->bookedByAdmin ? [
                    'id' => $booking->bookedByAdmin->id,
                    'name' => $booking->bookedByAdmin->name,
                ] : null,
                'payment' => $booking->payment ? $this->mapPayment($booking->payment) : null,
                'payments' => $booking->payments->map(fn (Payment $payment) => $this->mapPayment($payment))->values(),
                'queue_entry' => $booking->queueEntry ? [
                    'id' => $booking->queueEntry->id,
                    'queue_number' => $booking->queueEntry->queue_number,
                    'status' => $booking->queueEntry->status,
                    'source' => $booking->queueEntry->source,
                ] : null,
                'override_log' => $overrideLog ? [
                    'override_date' => $overrideLog->override_date,
                    'start_time' => $overrideLog->start_time,
                    'end_time' => $overrideLog->end_time,
                    'reason' => $overrideLog->reason,
                ] : null,
            ],
        ]);
    }

    private function mapPayment(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'type' => $payment->type,
            'amount' => $payment->amount,
            'return_amount' => $payment->return_amount,
            'hpp_amount' => $payment->hpp_amount,
            'provider' => $payment->provider,
            'midtrans_order_id' => $payment->midtrans_order_id,
            'status' => $payment->status,
            'paid_at' => $payment->paid_at?->toIso8601String(),
            'created_at' => $payment->created_at?->toIso8601String(),
        ];
    }

    public function store(Request $request, TimeSlotService $timeSlotService): RedirectResponse
    {
        $data = $request->validate([
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')->where('is_active', true)],
            'slot_id' => ['required', 'integer', 'exists:time_slots,id'],
            'consultation_mode' => ['required', 'in:offline,online'],
            'patient_type' => ['required', 'in:registered,guest'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'guest_patient_name' => ['nullable', 'string', 'max:255'],
            'guest_whatsapp' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'override_clinic_hours' => ['nullable', 'boolean'],
            'override_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($data['patient_type'] === 'registered') {
            $request->validate([
                'user_id' => ['required', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('role', 'patient')->orWhereNull('role'))],
            ]);
        } else {
            $request->validate([
                'guest_patient_name' => ['required', 'string', 'max:255'],
                'guest_whatsapp' => ['required', 'string', 'max:255'],
            ]);
        }

        $admin = $request->user();

        $booking = DB::transaction(function () use ($data, $admin, $timeSlotService) {
            $slot = TimeSlot::query()
                ->with('doctor')
                ->lockForUpdate()
                ->findOrFail($data['slot_id']);

            if ($slot->doctor_id !== $data['doctor_id'] || ! $slot->doctor?->is_active) {
                abort(422, 'Selected slot does not belong to this doctor.');
            }

            if (! $slot->start_time->isFuture()) {
                abort(422, 'Please select a future slot.');
            }

            $withinClinicHours = $timeSlotService->isSlotWithinClinicHours($slot);
            $overrideClinicHours = (bool) ($data['override_clinic_hours'] ?? false);

            if (! $withinClinicHours && ! $overrideClinicHours) {
                abort(422, 'Appointments are only available during clinic hours.');
            }

            if (! $withinClinicHours && blank($data['override_reason'] ?? null)) {
                abort(422, 'An override reason is required for outside-hours bookings.');
            }

            if ($slot->status === 'booked') {
                abort(422, 'This slot has already been booked.');
            }

            if ($slot->status === 'locked' && $slot->locked_until?->isFuture()) {
                abort(422, 'This slot is temporarily locked. Please try again shortly.');
            }

            $userId = $data['patient_type'] === 'registered' ? $data['user_id'] : null;

            $booking = Booking::create([
                'user_id' => $userId,
                'booked_by_admin_id' => $admin->id,
                'doctor_id' => $data['doctor_id'],
                'slot_id' => $slot->id,
                'status' => 'confirmed',
                'booking_source' => 'admin_assisted',
                'consultation_mode' => $data['consultation_mode'],
                'guest_patient_name' => $data['patient_type'] === 'guest' ? $data['guest_patient_name'] : null,
                'guest_whatsapp' => $data['patient_type'] === 'guest' ? $data['guest_whatsapp'] : null,
                'notes' => $data['notes'] ?? null,
                'meeting_link_requested_at' => $data['consultation_mode'] === 'online' ? now() : null,
            ]);

            $slot->update([
                'status' => 'booked',
                'locked_until' => null,
                'locked_by_user_id' => null,
            ]);

            if (! $withinClinicHours) {
                ScheduleOverrideLog::create([
                    'admin_user_id' => $admin->id,
                    'doctor_id' => $slot->doctor_id,
                    'booking_id' => $booking->id,
                    'slot_id' => $slot->id,
                    'override_date' => $slot->start_time->toDateString(),
                    'start_time' => $slot->start_time->format('H:i:s'),
                    'end_time' => $slot->end_time->format('H:i:s'),
                    'reason' => $data['override_reason'],
                ]);
            }

            return $booking;
        });

        $this->dispatchNotifications($booking);

        return redirect()->route('admin.bookings.index')->with('success', 'Booking confirmed successfully.');
    }

    private function dispatchNotifications(Booking $booking): void
    {
        if ($booking->consultation_mode === 'online') {
            SendBookingNotificationJob::dispatch($booking->fresh(), 'doctor-link-request');
        }

        SendBookingNotificationJob::dispatch($booking->fresh(), 'admin-booking-confirmation');
    }
}
