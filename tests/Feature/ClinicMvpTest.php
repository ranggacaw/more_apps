<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\Payment;
use App\Models\TimeSlot;
use App\Models\User;
use App\Services\TimeSlotService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClinicMvpTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_registration_defaults_to_patient_role(): void
    {
        $response = $this->post(route('register'), [
            'name' => 'Alya',
            'email' => 'alya@example.com',
            'phone' => '620000000099',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('verification.notice', absolute: false));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'alya@example.com',
            'role' => 'patient',
            'phone' => '620000000099',
        ]);
    }

    public function test_doctor_availability_generates_slots(): void
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Wellness',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        $this->actingAs($doctorUser)->post(route('doctor.availability.store'), [
            'day_of_week' => now()->addDay()->dayOfWeek,
            'start_time' => '09:00',
            'end_time' => '11:00',
            'slot_duration_minutes' => 30,
        ])->assertRedirect();

        $this->assertDatabaseHas('doctor_availabilities', [
            'doctor_id' => $doctor->id,
        ]);

        $this->assertGreaterThan(0, TimeSlot::query()->count());
    }

    public function test_patient_booking_is_confirmed_after_payment_callback(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        $availability = $doctor->availabilities()->create([
            'day_of_week' => now()->addDay()->dayOfWeek,
            'start_time' => '10:00',
            'end_time' => '12:00',
            'slot_duration_minutes' => 30,
            'is_active' => true,
        ]);

        app(TimeSlotService::class)->generateUpcomingSlots($availability, 2);

        $slot = TimeSlot::query()->firstOrFail();

        $this->actingAs($patient)->postJson(route('slots.lock'), [
            'slot_id' => $slot->id,
        ])->assertOk();

        $this->post(route('bookings.store'), [
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'notes' => 'Sensitive skin',
        ])->assertRedirect();

        $booking = Booking::query()->firstOrFail();

        $this->get(route('patient.checkout', $booking))->assertOk();

        $payment = Payment::query()->firstOrFail();

        $this->postJson(route('payments.webhook'), [
            'order_id' => $payment->midtrans_order_id,
            'transaction_status' => 'settlement',
            'gross_amount' => (string) $payment->amount,
            'status_code' => '200',
        ])->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
        ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'paid',
        ]);

        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'booked',
        ]);
    }

    public function test_doctor_cannot_access_admin_dashboard(): void
    {
        $doctor = User::factory()->create(['role' => 'doctor']);

        $this->actingAs($doctor)
            ->get(route('admin.dashboard'))
            ->assertForbidden();
    }
}
