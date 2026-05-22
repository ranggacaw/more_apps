<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\Payment;
use App\Models\TimeSlot;
use App\Models\User;
use App\Services\TimeSlotService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
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

    public function test_booking_page_only_lists_active_doctors_with_public_profile_fields(): void
    {
        Storage::fake('clinic-assets');
        config(['clinic.asset_disk' => 'clinic-assets']);

        $patient = User::factory()->create(['role' => 'patient']);
        $activeDoctorUser = User::factory()->create(['role' => 'doctor', 'name' => 'Dr. Active']);
        $inactiveDoctorUser = User::factory()->create(['role' => 'doctor', 'name' => 'Dr. Inactive']);

        Storage::disk('clinic-assets')->put('clinic/doctors/active.jpg', 'photo');
        Storage::disk('clinic-assets')->put('clinic/doctors/inactive.jpg', 'photo');

        Doctor::create([
            'user_id' => $activeDoctorUser->id,
            'specialization' => 'Dermatology',
            'bio' => 'Focuses on acne and skin barrier repair.',
            'avatar_url' => 'clinic/doctors/active.jpg',
            'consultation_fee' => 450000,
            'is_active' => true,
        ]);

        Doctor::create([
            'user_id' => $inactiveDoctorUser->id,
            'specialization' => 'Nutrition',
            'bio' => 'Should not appear in booking discovery.',
            'avatar_url' => 'clinic/doctors/inactive.jpg',
            'consultation_fee' => 350000,
            'is_active' => false,
        ]);

        $this->actingAs($patient)
            ->get(route('bookings.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/BookConsultation')
                ->has('doctors', 1)
                ->where('doctors.0.name', 'Dr. Active')
                ->where('doctors.0.specialization', 'Dermatology')
                ->where('doctors.0.bio', 'Focuses on acne and skin barrier repair.')
                ->where('doctors.0.avatar_url', fn ($value) => is_string($value) && str_contains($value, 'clinic/doctors/active.jpg'))
                ->where('doctors.0.consultation_fee', 450000));
    }

    public function test_booking_page_uses_signed_asset_route_for_doctor_avatar_when_temporary_urls_are_unavailable(): void
    {
        config(['clinic.asset_disk' => 'public']);

        $patient = User::factory()->create(['role' => 'patient']);
        $doctorUser = User::factory()->create(['role' => 'doctor', 'name' => 'Dr. Public']);

        Storage::disk('public')->put('clinic/doctors/public-avatar.jpg', 'photo');

        Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Dermatology',
            'bio' => 'Visible with a storage URL fallback.',
            'avatar_url' => 'clinic/doctors/public-avatar.jpg',
            'consultation_fee' => 450000,
            'is_active' => true,
        ]);

        $this->actingAs($patient)
            ->get(route('bookings.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/BookConsultation')
                ->where('doctors.0.avatar_url', fn ($value) => is_string($value)
                    && str_contains($value, '/clinic-assets/clinic/doctors/public-avatar.jpg?')
                    && str_contains($value, 'signature=')));
    }

    public function test_home_page_omits_missing_doctor_avatar_urls(): void
    {
        Storage::fake('public');
        config(['clinic.asset_disk' => 'public']);

        $doctorUser = User::factory()->create(['role' => 'doctor', 'name' => 'Dr. Missing Avatar']);

        Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Dermatology',
            'bio' => 'Falls back to initials when the managed avatar file is gone.',
            'avatar_url' => 'clinic/doctors/missing-avatar.jpg',
            'consultation_fee' => 450000,
            'is_active' => true,
        ]);

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->where('doctors.0.avatar_url', null));
    }

    public function test_active_doctor_slot_search_generates_missing_future_slots_only(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 8, 0));

        try {
            $patient = User::factory()->create(['role' => 'patient']);
            $activeDoctorUser = User::factory()->create(['role' => 'doctor']);
            $inactiveDoctorUser = User::factory()->create(['role' => 'doctor']);

            $activeDoctor = Doctor::create([
                'user_id' => $activeDoctorUser->id,
                'specialization' => 'Aesthetic Medicine',
                'consultation_fee' => 500000,
                'is_active' => true,
            ]);

            $inactiveDoctor = Doctor::create([
                'user_id' => $inactiveDoctorUser->id,
                'specialization' => 'General Medicine',
                'consultation_fee' => 400000,
                'is_active' => false,
            ]);

            $activeDoctor->availabilities()->create([
                'day_of_week' => now()->dayOfWeek,
                'start_time' => '09:00',
                'end_time' => '10:00',
                'slot_duration_minutes' => 30,
                'is_active' => true,
            ]);

            TimeSlot::create([
                'doctor_id' => $activeDoctor->id,
                'start_time' => now()->setTime(7, 30),
                'end_time' => now()->setTime(8, 0),
                'status' => 'available',
            ]);

            $response = $this->actingAs($patient)
                ->getJson(route('api.slots', [
                    'doctor_id' => $activeDoctor->id,
                    'date' => now()->toDateString(),
                ]));

            $response->assertOk();
            $response->assertJsonCount(2, 'data');
            $response->assertJsonPath('data.0.start_time', now()->setTime(9, 0)->toJSON());
            $response->assertJsonPath('data.1.start_time', now()->setTime(9, 30)->toJSON());

            $this->actingAs($patient)
                ->getJson(route('api.slots', [
                    'doctor_id' => $inactiveDoctor->id,
                    'date' => now()->toDateString(),
                ]))
                ->assertUnprocessable();
        } finally {
            Carbon::setTestNow();
        }
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

        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        $grossAmount = (string) $payment->amount;
        $statusCode = '200';

        $this->postJson(route('payments.webhook'), [
            'order_id' => $payment->midtrans_order_id,
            'transaction_status' => 'settlement',
            'gross_amount' => $grossAmount,
            'status_code' => $statusCode,
            'signature_key' => hash('sha512', $payment->midtrans_order_id.$statusCode.$grossAmount.config('midtrans.server_key')),
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

    public function test_doctor_dashboard_shows_only_current_confirmed_workload_with_intake_context(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));

        try {
            $doctorUser = User::factory()->create(['role' => 'doctor']);
            $doctor = Doctor::create([
                'user_id' => $doctorUser->id,
                'specialization' => 'Wellness',
                'consultation_fee' => 500000,
                'is_active' => true,
            ]);

            $otherDoctorUser = User::factory()->create(['role' => 'doctor']);
            $otherDoctor = Doctor::create([
                'user_id' => $otherDoctorUser->id,
                'specialization' => 'Nutrition',
                'consultation_fee' => 500000,
                'is_active' => true,
            ]);

            $patient = User::factory()->create([
                'role' => 'patient',
                'name' => 'Alya Patient',
                'email' => 'alya-patient@example.com',
                'phone' => '620000000222',
            ]);

            $sameDayBooking = Booking::create([
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'slot_id' => TimeSlot::create([
                    'doctor_id' => $doctor->id,
                    'start_time' => now()->setTime(11, 0),
                    'end_time' => now()->setTime(11, 30),
                    'status' => 'booked',
                ])->id,
                'status' => 'confirmed',
                'notes' => 'Patch test uploaded before the session.',
                'patient_upload_path' => 'clinic/patient-uploads/booking-1/lab-results.pdf',
                'meeting_link' => 'https://meet.example.test/doctor-room',
            ]);

            $futureBooking = Booking::create([
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'slot_id' => TimeSlot::create([
                    'doctor_id' => $doctor->id,
                    'start_time' => now()->addDay()->setTime(9, 30),
                    'end_time' => now()->addDay()->setTime(10, 0),
                    'status' => 'booked',
                ])->id,
                'status' => 'confirmed',
            ]);

            Booking::create([
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'slot_id' => TimeSlot::create([
                    'doctor_id' => $doctor->id,
                    'start_time' => now()->addDay()->setTime(13, 0),
                    'end_time' => now()->addDay()->setTime(13, 30),
                    'status' => 'locked',
                    'locked_by_user_id' => $patient->id,
                    'locked_until' => now()->addMinutes(15),
                ])->id,
                'status' => 'pending',
            ]);

            Booking::create([
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'slot_id' => TimeSlot::create([
                    'doctor_id' => $doctor->id,
                    'start_time' => now()->subDay()->setTime(15, 0),
                    'end_time' => now()->subDay()->setTime(15, 30),
                    'status' => 'booked',
                ])->id,
                'status' => 'confirmed',
            ]);

            Booking::create([
                'user_id' => $patient->id,
                'doctor_id' => $otherDoctor->id,
                'slot_id' => TimeSlot::create([
                    'doctor_id' => $otherDoctor->id,
                    'start_time' => now()->setTime(10, 0),
                    'end_time' => now()->setTime(10, 30),
                    'status' => 'booked',
                ])->id,
                'status' => 'confirmed',
            ]);

            $this->actingAs($doctorUser)
                ->get(route('doctor.dashboard'))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Doctor/Dashboard')
                    ->has('consultationWorkload', 2)
                    ->where('consultationWorkload.0.id', $sameDayBooking->id)
                    ->where('consultationWorkload.0.patient.name', 'Alya Patient')
                    ->where('consultationWorkload.0.meeting_link', 'https://meet.example.test/doctor-room')
                    ->where('consultationWorkload.0.intake.notes', 'Patch test uploaded before the session.')
                    ->where('consultationWorkload.0.intake.patient_upload_name', 'lab-results.pdf')
                    ->where('consultationWorkload.0.is_today', true)
                    ->where('consultationWorkload.1.id', $futureBooking->id)
                    ->where('consultationWorkload.1.meeting_link', null)
                    ->where('consultationWorkload.1.intake.notes', null)
                    ->where('consultationWorkload.1.intake.patient_upload_name', null));
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_doctor_cannot_access_admin_dashboard(): void
    {
        $doctor = User::factory()->create(['role' => 'doctor']);

        $this->actingAs($doctor)
            ->get(route('admin.dashboard'))
            ->assertForbidden();
    }
}
