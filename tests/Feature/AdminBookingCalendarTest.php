<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\ClinicQueueEntry;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminBookingCalendarTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_booking_calendar_with_props(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();

        $this->actingAs($admin)
            ->get(route('admin.calendar.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/BookingCalendar')
                ->where('view', 'month')
                ->has('calendarDays')
                ->has('selectedBookings')
                ->has('doctors')
                ->has('statuses')
                ->has('modes')
                ->has('filters')
                ->has('summary')
                ->where('today', now()->toDateString()));
    }

    public function test_patient_cannot_access_booking_calendar(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($patient)
            ->get(route('admin.calendar.index'))
            ->assertForbidden();
    }

    public function test_doctor_cannot_access_booking_calendar(): void
    {
        [$doctorUser] = $this->createDoctorFixture();

        $this->actingAs($doctorUser)
            ->get(route('admin.calendar.index'))
            ->assertForbidden();
    }

    public function test_calendar_includes_visible_range_and_excludes_out_of_range_bookings(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);

        $center = now()->startOfMonth()->addDays(10);
        $inRangeSlot = $this->createSlot($doctor, $center->copy()->setTime(10, 0), 'booked');
        $outOfRangeSlot = $this->createSlot($doctor, now()->addMonths(3)->setTime(10, 0), 'booked');

        $this->createConfirmedBooking(['doctor' => $doctor, 'slot' => $inRangeSlot, 'user' => $patient]);
        $this->createConfirmedBooking(['doctor' => $doctor, 'slot' => $outOfRangeSlot, 'user' => $patient]);

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => $center->toDateString(), 'view' => 'month']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('selectedBookings', 1)
                ->where('summary.visible_bookings', 1)
                ->where('summary.selected_bookings', 1)
                ->where('selectedBookings.0.id', Booking::where('slot_id', $inRangeSlot->id)->first()->id));
    }

    public function test_calendar_payload_resolves_registered_patient(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create([
            'role' => 'patient',
            'name' => 'Rina Wijaya',
            'phone' => '628111222333',
        ]);

        $slot = $this->createSlot($doctor, now()->setTime(11, 0), 'booked');
        $this->createConfirmedBooking(['doctor' => $doctor, 'slot' => $slot, 'user' => $patient]);

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => now()->toDateString(), 'view' => 'day']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('selectedBookings', 1)
                ->where('selectedBookings.0.patient_name', 'Rina Wijaya')
                ->where('selectedBookings.0.patient_phone', '628111222333')
                ->where('selectedBookings.0.is_guest', false)
                ->where('selectedBookings.0.patient_type_label', 'Registered'));
    }

    public function test_calendar_payload_resolves_guest_patient(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();

        $slot = $this->createSlot($doctor, now()->setTime(13, 0), 'booked');
        $this->createConfirmedBooking([
            'doctor' => $doctor,
            'slot' => $slot,
            'user' => null,
            'guestName' => 'Budi Santoso',
            'guestWhatsapp' => '6281234567890',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => now()->toDateString(), 'view' => 'day']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('selectedBookings', 1)
                ->where('selectedBookings.0.patient_name', 'Budi Santoso')
                ->where('selectedBookings.0.patient_phone', '6281234567890')
                ->where('selectedBookings.0.is_guest', true)
                ->where('selectedBookings.0.patient_type_label', 'Guest'));
    }

    public function test_calendar_payload_includes_queue_state_for_checked_in_booking(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);

        $slot = $this->createSlot($doctor, now()->setTime(9, 0), 'booked');
        $booking = $this->createConfirmedBooking(['doctor' => $doctor, 'slot' => $slot, 'user' => $patient]);

        ClinicQueueEntry::create([
            'source_type' => 'booking',
            'booking_id' => $booking->id,
            'queue_date' => $slot->start_time->toDateString(),
            'queue_sequence' => 1,
            'queue_number' => 'Q-001',
            'patient_name' => $booking->patientDisplayName(),
            'patient_phone' => $booking->patientContactPhone(),
            'doctor_id' => $booking->doctor_id,
            'status' => 'waiting',
            'queued_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => now()->toDateString(), 'view' => 'day']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('selectedBookings', 1)
                ->where('selectedBookings.0.queue_number', 'Q-001')
                ->where('selectedBookings.0.queue_status', 'waiting'));
    }

    public function test_calendar_filters_by_status_mode_and_doctor(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser1, $doctor1] = $this->createDoctorFixture();
        [$doctorUser2, $doctor2] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);

        $slot1 = $this->createSlot($doctor1, now()->setTime(9, 0), 'booked');
        $slot2 = $this->createSlot($doctor2, now()->setTime(10, 0), 'booked');

        $offline = $this->createConfirmedBooking(['doctor' => $doctor1, 'slot' => $slot1, 'user' => $patient, 'mode' => 'offline']);
        $online = $this->createConfirmedBooking(['doctor' => $doctor2, 'slot' => $slot2, 'user' => $patient, 'mode' => 'online']);

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => now()->toDateString(), 'view' => 'day', 'mode' => 'online']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('selectedBookings', 1)
                ->where('selectedBookings.0.id', $online->id));

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => now()->toDateString(), 'view' => 'day', 'doctor_id' => $doctor1->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('selectedBookings', 1)
                ->where('selectedBookings.0.id', $offline->id));

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => now()->toDateString(), 'view' => 'day', 'status' => 'completed']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('selectedBookings', 0));
    }

    public function test_calendar_view_switch_returns_expected_grid_size(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => now()->toDateString(), 'view' => 'week']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('view', 'week')
                ->has('calendarDays', 7));

        $this->actingAs($admin)
            ->get(route('admin.calendar.index', ['date' => now()->toDateString(), 'view' => 'day']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('view', 'day')
                ->has('calendarDays', 1));
    }

    private function createAdmin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    private function createDoctorFixture(): array
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        return [$doctorUser, $doctor];
    }

    private function createSlot(Doctor $doctor, Carbon $startTime, string $status = 'available'): TimeSlot
    {
        return TimeSlot::create([
            'doctor_id' => $doctor->id,
            'start_time' => $startTime,
            'end_time' => $startTime->copy()->addMinutes(30),
            'status' => $status,
        ]);
    }

    private function createConfirmedBooking(array $attributes): Booking
    {
        return Booking::create([
            'user_id' => $attributes['user']?->id,
            'booked_by_admin_id' => User::factory()->create(['role' => 'admin'])->id,
            'doctor_id' => $attributes['doctor']->id,
            'slot_id' => $attributes['slot']->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => $attributes['mode'] ?? 'offline',
            'guest_patient_name' => $attributes['guestName'] ?? null,
            'guest_whatsapp' => $attributes['guestWhatsapp'] ?? null,
        ]);
    }
}
