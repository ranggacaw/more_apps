<?php

namespace Tests\Feature;

use App\Jobs\SendBookingNotificationJob;
use App\Models\Booking;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminAssistedBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_cannot_access_admin_booking_routes(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($patient)
            ->get(route('admin.bookings.index'))
            ->assertForbidden();

        $this->actingAs($patient)
            ->post(route('admin.bookings.store'), [])
            ->assertForbidden();
    }

    public function test_doctor_cannot_access_admin_booking_routes(): void
    {
        [$doctorUser] = $this->createDoctorFixture();

        $this->actingAs($doctorUser)
            ->get(route('admin.bookings.index'))
            ->assertForbidden();

        $this->actingAs($doctorUser)
            ->post(route('admin.bookings.store'), [])
            ->assertForbidden();
    }

    public function test_admin_can_view_booking_assistance_page(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($admin)
            ->get(route('admin.bookings.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Bookings')
                ->has('doctors', 1)
                ->has('patients', 1));
    }

    public function test_admin_can_create_registered_patient_offline_booking(): void
    {
        Queue::fake();
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0));

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'consultation_mode' => 'offline',
                'patient_type' => 'registered',
                'user_id' => $patient->id,
                'notes' => 'Walk-in clinic visit',
            ])
            ->assertRedirect(route('admin.bookings.index'));

        $this->assertDatabaseHas('bookings', [
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'offline',
            'booked_by_admin_id' => $admin->id,
            'guest_patient_name' => null,
            'guest_whatsapp' => null,
        ]);

        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'booked',
            'locked_until' => null,
            'locked_by_user_id' => null,
        ]);

        $this->assertDatabaseMissing('payments', [
            'booking_id' => Booking::first()->id,
        ]);

        Queue::assertPushed(SendBookingNotificationJob::class, function ($job) {
            return $job->type === 'admin-booking-confirmation';
        });
    }

    public function test_admin_can_create_guest_online_booking(): void
    {
        Queue::fake();
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(14, 0));

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'consultation_mode' => 'online',
                'patient_type' => 'guest',
                'guest_patient_name' => 'Budi Santoso',
                'guest_whatsapp' => '6281234567890',
                'notes' => null,
            ])
            ->assertRedirect(route('admin.bookings.index'));

        $this->assertDatabaseHas('bookings', [
            'user_id' => null,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'online',
            'booked_by_admin_id' => $admin->id,
            'guest_patient_name' => 'Budi Santoso',
            'guest_whatsapp' => '6281234567890',
            'meeting_link' => null,
        ]);

        $this->assertNotNull(Booking::first()->meeting_link_requested_at);

        Queue::assertPushed(SendBookingNotificationJob::class, function ($job) {
            return $job->type === 'doctor-link-request';
        });

        Queue::assertPushed(SendBookingNotificationJob::class, function ($job) {
            return $job->type === 'admin-booking-confirmation';
        });
    }

    public function test_guest_booking_requires_name_and_whatsapp(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0));

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'consultation_mode' => 'offline',
                'patient_type' => 'guest',
            ])
            ->assertSessionHasErrors(['guest_patient_name', 'guest_whatsapp']);
    }

    public function test_registered_booking_requires_user_id(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0));

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'consultation_mode' => 'offline',
                'patient_type' => 'registered',
            ])
            ->assertSessionHasErrors(['user_id']);
    }

    public function test_admin_booking_rejects_already_booked_slot(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');

        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($admin)
            ->from(route('admin.bookings.index'))
            ->post(route('admin.bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'consultation_mode' => 'offline',
                'patient_type' => 'registered',
                'user_id' => $patient->id,
            ])
            ->assertStatus(422);
    }

    public function test_admin_booking_rejects_locked_slot(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'locked');
        $slot->update(['locked_until' => now()->addMinutes(15), 'locked_by_user_id' => $admin->id]);

        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($admin)
            ->from(route('admin.bookings.index'))
            ->post(route('admin.bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'consultation_mode' => 'offline',
                'patient_type' => 'registered',
                'user_id' => $patient->id,
            ])
            ->assertStatus(422);
    }

    public function test_admin_booking_bypasses_midtrans_payment(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0));
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'consultation_mode' => 'offline',
                'patient_type' => 'registered',
                'user_id' => $patient->id,
            ]);

        $this->assertEquals(0, \App\Models\Payment::count());
    }

    public function test_doctor_can_save_google_meet_link_for_own_booking(): void
    {
        Queue::fake();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $admin = $this->createAdmin();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => null,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'online',
            'guest_patient_name' => 'Guest',
            'guest_whatsapp' => '6281234567890',
            'meeting_link_requested_at' => now(),
        ]);

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.meeting-link', $booking), [
                'meeting_link' => 'https://meet.google.com/abc-defg-hij',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'meeting_link' => 'https://meet.google.com/abc-defg-hij',
        ]);
        $this->assertNotNull($booking->fresh()->meeting_link_submitted_at);

        Queue::assertPushed(SendBookingNotificationJob::class, function ($job) {
            return $job->type === 'meeting-link-ready';
        });
    }

    public function test_doctor_cannot_save_invalid_meeting_link(): void
    {
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $admin = $this->createAdmin();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => null,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'online',
            'guest_patient_name' => 'Guest',
            'guest_whatsapp' => '6281234567890',
        ]);

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.meeting-link', $booking), [
                'meeting_link' => 'https://zoom.us/j/123456',
            ])
            ->assertSessionHasErrors('meeting_link');

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.meeting-link', $booking), [
                'meeting_link' => 'not-a-url',
            ])
            ->assertSessionHasErrors('meeting_link');
    }

    public function test_unrelated_doctor_cannot_save_meeting_link(): void
    {
        [$doctorUser1, $doctor1] = $this->createDoctorFixture();
        [$doctorUser2, $doctor2] = $this->createDoctorFixture();
        $admin = $this->createAdmin();
        $slot = $this->createSlot($doctor1, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => null,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor1->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'online',
            'guest_patient_name' => 'Guest',
            'guest_whatsapp' => '6281234567890',
        ]);

        $this->actingAs($doctorUser2)
            ->post(route('doctor.bookings.meeting-link', $booking), [
                'meeting_link' => 'https://meet.google.com/abc-defg-hij',
            ])
            ->assertForbidden();
    }

    public function test_online_consultation_cannot_be_completed_without_meeting_link(): void
    {
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $admin = $this->createAdmin();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => null,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'online',
            'guest_patient_name' => 'Guest',
            'guest_whatsapp' => '6281234567890',
            'meeting_link_requested_at' => now(),
        ]);

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Completion attempt',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
        ]);
    }

    public function test_offline_admin_booking_can_be_completed_normally(): void
    {
        Queue::fake();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $admin = $this->createAdmin();
        $patient = User::factory()->create(['role' => 'patient']);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'offline',
        ]);

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Consultation completed.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'completed',
        ]);
    }

    public function test_online_booking_completable_after_doctor_adds_link(): void
    {
        Queue::fake();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $admin = $this->createAdmin();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => null,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'online',
            'guest_patient_name' => 'Guest',
            'guest_whatsapp' => '6281234567890',
            'meeting_link' => 'https://meet.google.com/abc-defg-hij',
            'meeting_link_submitted_at' => now(),
        ]);

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Consultation completed via Meet.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'completed',
        ]);
    }

    public function test_consultation_workspace_shows_missing_link_state(): void
    {
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $admin = $this->createAdmin();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => null,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'online',
            'guest_patient_name' => 'Guest',
            'guest_whatsapp' => '6281234567890',
            'meeting_link_requested_at' => now(),
        ]);

        $this->actingAs($doctorUser)
            ->get(route('doctor.consultations.show', $booking))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/ConsultationWorkspace')
                ->where('booking.needs_meeting_link', true)
                ->where('booking.can_complete', false)
                ->where('booking.is_guest', true)
                ->where('booking.consultation_mode', 'online'));
    }

    public function test_booking_model_resolves_guest_display_name(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => null,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'guest_patient_name' => 'Siti Aminah',
            'guest_whatsapp' => '6281234567890',
        ]);

        $this->assertEquals('Siti Aminah', $booking->patientDisplayName());
        $this->assertEquals('6281234567890', $booking->patientContactPhone());
        $this->assertNull($booking->patientContactEmail());
        $this->assertTrue($booking->isGuestBooking());
        $this->assertTrue($booking->isAdminAssisted());
    }

    public function test_booking_model_resolves_registered_patient_display(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $patient = User::factory()->create(['role' => 'patient', 'name' => 'Rina', 'phone' => '628111', 'email' => 'rina@test.com']);
        $booking = Booking::create([
            'user_id' => $patient->id,
            'booked_by_admin_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
        ]);

        $this->assertEquals('Rina', $booking->patientDisplayName());
        $this->assertEquals('628111', $booking->patientContactPhone());
        $this->assertEquals('rina@test.com', $booking->patientContactEmail());
        $this->assertFalse($booking->isGuestBooking());
    }

    public function test_admin_can_fetch_available_slots(): void
    {
        $admin = $this->createAdmin();
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0));
        $date = $slot->start_time->toDateString();

        $response = $this->actingAs($admin)
            ->getJson(route('admin.admin.slots', ['doctor_id' => $doctor->id, 'date' => $date]))
            ->assertOk()
            ->assertJsonStructure(['data']);

        $this->assertNotEmpty($response->json('data'));
    }

    public function test_self_service_booking_still_works(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'locked');
        $slot->update(['locked_by_user_id' => $patient->id, 'locked_until' => now()->addMinutes(15)]);

        $this->actingAs($patient)
            ->post(route('bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'notes' => null,
            ])
            ->assertRedirect(route('patient.checkout', Booking::first()));

        $this->assertDatabaseHas('bookings', [
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'pending',
            'booking_source' => 'self_service',
        ]);
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
}
