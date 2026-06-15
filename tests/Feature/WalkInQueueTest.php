<?php

namespace Tests\Feature;

use App\Models\AestheticProgram;
use App\Models\Booking;
use App\Models\ClinicQueueEntry;
use App\Models\ConsultationPackageOption;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Models\User;
use Database\Seeders\ConsultationTreatmentBillingSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WalkInQueueTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;

    private User $doctorUser;

    private Doctor $doctor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
        $this->doctorUser = User::factory()->create(['role' => 'doctor', 'email_verified_at' => now()]);
        $this->doctor = Doctor::create([
            'user_id' => $this->doctorUser->id,
            'specialization' => 'General Practitioner',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_add_walk_in_patient_to_queue(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.queue.store'), [
                'patient_name' => 'Alice Smith',
                'patient_phone' => '+6281111111',
                'complaint_notes' => 'Fever and cold',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('clinic_queue_entries', [
            'patient_name' => 'Alice Smith',
            'patient_phone' => '+6281111111',
            'complaint_notes' => 'Fever and cold',
            'status' => 'waiting',
            'queue_number' => 'Q-001',
            'source_type' => 'walk_in',
            'queue_sequence' => 1,
        ]);
    }

    public function test_admin_can_assign_patient_to_active_doctor(): void
    {
        $entry = ClinicQueueEntry::create([
            'queue_number' => 'Q-001',
            'patient_name' => 'Bob',
            'status' => 'waiting',
            'queued_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.assign', $entry), [
                'doctor_id' => $this->doctor->id,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('clinic_queue_entries', [
            'id' => $entry->id,
            'doctor_id' => $this->doctor->id,
            'status' => 'waiting',
        ]);

        $this->assertNotNull($entry->fresh()->assigned_at);
    }

    public function test_admin_cannot_assign_non_waiting_patient(): void
    {
        $entry = ClinicQueueEntry::create([
            'queue_number' => 'Q-001',
            'patient_name' => 'Bob',
            'status' => 'completed',
            'queued_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.assign', $entry), [
                'doctor_id' => $this->doctor->id,
            ]);

        $response->assertSessionHasErrors(['error']);
        $this->assertEquals('completed', $entry->fresh()->status);
    }

    public function test_admin_cannot_assign_to_inactive_doctor(): void
    {
        $entry = ClinicQueueEntry::create([
            'queue_number' => 'Q-001',
            'patient_name' => 'Bob',
            'status' => 'waiting',
            'queued_at' => now(),
        ]);

        $this->doctor->update(['is_active' => false]);

        $response = $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.assign', $entry), [
                'doctor_id' => $this->doctor->id,
            ]);

        $response->assertSessionHasErrors(['error']);
        $this->assertEquals('waiting', $entry->fresh()->status);
    }

    public function test_admin_can_cancel_waiting_or_assigned_patient(): void
    {
        $entry1 = ClinicQueueEntry::create([
            'queue_number' => 'Q-001',
            'patient_name' => 'Bob',
            'status' => 'waiting',
            'queued_at' => now(),
        ]);

        $entry2 = ClinicQueueEntry::create([
            'queue_number' => 'Q-002',
            'patient_name' => 'Charlie',
            'status' => 'assigned',
            'doctor_id' => $this->doctor->id,
            'queued_at' => now(),
            'assigned_at' => now(),
        ]);

        $response1 = $this->actingAs($this->adminUser)->patch(route('admin.queue.cancel', $entry1));
        $response1->assertRedirect();
        $this->assertEquals('cancelled', $entry1->fresh()->status);
        $this->assertNotNull($entry1->fresh()->cancelled_at);

        $response2 = $this->actingAs($this->adminUser)->patch(route('admin.queue.cancel', $entry2));
        $response2->assertRedirect();
        $this->assertEquals('cancelled', $entry2->fresh()->status);
        $this->assertNotNull($entry2->fresh()->cancelled_at);
    }

    public function test_doctor_can_start_open_and_complete_consultation_workspace(): void
    {
        $this->seed(ConsultationTreatmentBillingSeeder::class);
        $program = AestheticProgram::create([
            'name' => 'Walk-in Facial',
            'price' => 750000,
            'hpp_amount' => 250000,
            'is_active' => true,
        ]);
        $diamond = ConsultationPackageOption::where('name', 'Diamond Trial')->firstOrFail();
        $entry = ClinicQueueEntry::create([
            'queue_number' => 'Q-001',
            'patient_name' => 'Bob',
            'patient_phone' => '+6282222222',
            'complaint_notes' => 'Interested in facial and slimming options',
            'status' => 'assigned',
            'doctor_id' => $this->doctor->id,
            'queued_at' => now(),
            'assigned_at' => now(),
        ]);

        // Start consultation
        $response1 = $this->actingAs($this->doctorUser)
            ->post(route('doctor.queue.start', $entry));

        $response1->assertRedirect(route('doctor.queue.workspace', $entry));
        $this->assertEquals('in_consultation', $entry->fresh()->status);
        $this->assertNotNull($entry->fresh()->consultation_started_at);

        $this->actingAs($this->doctorUser)
            ->get(route('doctor.queue.workspace', $entry))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/ConsultationWorkspace')
                ->where('booking.source_type', 'queue')
                ->where('booking.patient.name', 'Bob')
                ->where('booking.intake.notes', 'Interested in facial and slimming options')
                ->where('booking.can_complete', true)
                ->has('packageOptions')
                ->has('aestheticPrograms'));

        $response2 = $this->actingAs($this->doctorUser)
            ->post(route('doctor.queue.complete', $entry), [
                'notes' => 'Walk-in treatment completed safely.',
                'package_option_id' => $diamond->id,
                'diamond_oral_addon' => true,
                'aesthetic_program_lines' => [[
                    'aesthetic_program_id' => $program->id,
                    'quantity' => 1,
                    'dosage_value' => 1.5,
                    'dosage_unit' => 'ml',
                    'notes' => 'Face',
                ]],
            ]);

        $response2->assertRedirect(route('doctor.dashboard'));
        $this->assertEquals('completed', $entry->fresh()->status);
        $this->assertNotNull($entry->fresh()->completed_at);
        $this->assertDatabaseHas('consultations', [
            'queue_entry_id' => $entry->id,
            'booking_id' => null,
            'user_id' => null,
            'doctor_id' => $this->doctor->id,
            'notes' => 'Walk-in treatment completed safely.',
        ]);
        $this->assertDatabaseHas('consultation_line_items', [
            'type' => 'aesthetic_program',
            'name' => 'Walk-in Facial',
            'line_total' => 750000,
        ]);
        $this->assertDatabaseHas('payments', [
            'user_id' => null,
            'booking_id' => null,
            'queue_entry_id' => $entry->id,
            'type' => 'consultation_treatment',
            'provider' => 'internal',
            'status' => 'pending',
            'amount' => 3250000,
            'hpp_amount' => 250000,
        ]);

        $consultation = $entry->fresh()->consultation()->firstOrFail();

        $this->actingAs($this->doctorUser)
            ->get(route('doctor.medical-records.index', ['search' => '+6282222222']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/MedicalRecords')
                ->has('records', 1)
                ->where('records.0.patient.name', 'Bob')
                ->where('records.0.patient.phone', '+6282222222'));

        $this->actingAs($this->doctorUser)
            ->get(route('doctor.medical-records.show', ['recordType' => 'consultation', 'recordId' => $consultation->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/MedicalRecordDetail')
                ->where('record.patient.name', 'Bob')
                ->where('record.patient.source', 'walk_in')
                ->where('record.intake_notes', 'Interested in facial and slimming options')
                ->where('record.line_items.0.name', 'Walk-in Facial')
                ->where('record.billing.status', 'pending')
                ->where('record.billing.pending_amount', 3250000));
    }

    public function test_only_assigned_doctor_can_start_open_or_complete_consultation(): void
    {
        $otherDoctorUser = User::factory()->create(['role' => 'doctor', 'email_verified_at' => now()]);
        Doctor::create([
            'user_id' => $otherDoctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        $entry = ClinicQueueEntry::create([
            'queue_number' => 'Q-001',
            'patient_name' => 'Bob',
            'status' => 'assigned',
            'doctor_id' => $this->doctor->id,
            'queued_at' => now(),
            'assigned_at' => now(),
        ]);

        // Try start by another doctor
        $response = $this->actingAs($otherDoctorUser)
            ->post(route('doctor.queue.start', $entry));

        $response->assertStatus(403);
        $this->assertEquals('assigned', $entry->fresh()->status);

        $entry->update([
            'status' => 'in_consultation',
            'consultation_started_at' => now(),
        ]);

        $this->actingAs($otherDoctorUser)
            ->get(route('doctor.queue.workspace', $entry))
            ->assertStatus(403);

        $this->actingAs($otherDoctorUser)
            ->post(route('doctor.queue.complete', $entry), ['notes' => 'Should not save'])
            ->assertStatus(403);

        $this->assertEquals('in_consultation', $entry->fresh()->status);
        $this->assertDatabaseMissing('consultations', ['queue_entry_id' => $entry->id]);
    }

    public function test_daily_queue_number_increments_and_resets(): void
    {
        $this->travelTo(now()->startOfDay());

        $this->actingAs($this->adminUser)->post(route('admin.queue.store'), ['patient_name' => 'P1']);
        $this->actingAs($this->adminUser)->post(route('admin.queue.store'), ['patient_name' => 'P2']);

        $this->assertDatabaseHas('clinic_queue_entries', ['patient_name' => 'P1', 'queue_number' => 'Q-001']);
        $this->assertDatabaseHas('clinic_queue_entries', ['patient_name' => 'P2', 'queue_number' => 'Q-002']);

        // Travel to tomorrow
        $this->travel(1)->day();

        $this->actingAs($this->adminUser)->post(route('admin.queue.store'), ['patient_name' => 'P3']);
        $this->assertDatabaseHas('clinic_queue_entries', ['patient_name' => 'P3', 'queue_number' => 'Q-001']);
    }

    public function test_admin_can_check_in_same_day_booking_and_reject_duplicate_check_in(): void
    {
        $this->travelTo(now()->setTime(9, 0));
        $booking = $this->createTodayOfflineBooking();

        $response = $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.bookings.check-in', $booking));

        $response->assertRedirect();

        $this->assertDatabaseHas('clinic_queue_entries', [
            'source_type' => 'booking',
            'booking_id' => $booking->id,
            'doctor_id' => $this->doctor->id,
            'patient_name' => $booking->patient->name,
            'patient_phone' => $booking->patient->phone,
            'status' => 'waiting',
            'queue_number' => 'Q-001',
            'queue_sequence' => 1,
        ]);

        $duplicate = $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.bookings.check-in', $booking));

        $duplicate->assertSessionHasErrors(['booking']);
        $this->assertEquals(1, ClinicQueueEntry::where('booking_id', $booking->id)->count());
    }

    public function test_admin_can_mark_not_arrived_booking_no_show_without_queue_number(): void
    {
        $this->travelTo(now()->setTime(9, 0));
        $booking = $this->createTodayOfflineBooking();

        $response = $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.bookings.no-show', $booking));

        $response->assertRedirect();
        $this->assertEquals('no_show', $booking->fresh()->status);
        $this->assertNotNull($booking->fresh()->no_show_at);
        $this->assertDatabaseMissing('clinic_queue_entries', ['booking_id' => $booking->id]);

        $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.bookings.check-in', $booking))
            ->assertSessionHasErrors(['booking']);
    }

    public function test_queue_numbers_follow_arrival_order_across_walk_ins_and_bookings(): void
    {
        $this->travelTo(now()->setTime(9, 0));
        $booking = $this->createTodayOfflineBooking();

        $this->actingAs($this->adminUser)->post(route('admin.queue.store'), ['patient_name' => 'Walk In 1']);
        $this->actingAs($this->adminUser)->patch(route('admin.queue.bookings.check-in', $booking));
        $this->actingAs($this->adminUser)->post(route('admin.queue.store'), ['patient_name' => 'Walk In 2']);

        $this->assertDatabaseHas('clinic_queue_entries', ['patient_name' => 'Walk In 1', 'queue_number' => 'Q-001', 'queue_sequence' => 1]);
        $this->assertDatabaseHas('clinic_queue_entries', ['booking_id' => $booking->id, 'queue_number' => 'Q-002', 'queue_sequence' => 2]);
        $this->assertDatabaseHas('clinic_queue_entries', ['patient_name' => 'Walk In 2', 'queue_number' => 'Q-003', 'queue_sequence' => 3]);
    }

    public function test_database_rejects_duplicate_daily_queue_sequence(): void
    {
        $queueDate = now()->toDateString();

        ClinicQueueEntry::create([
            'source_type' => 'walk_in',
            'queue_date' => $queueDate,
            'queue_sequence' => 1,
            'queue_number' => 'Q-001',
            'patient_name' => 'First',
            'status' => 'waiting',
            'queued_at' => now(),
        ]);

        $this->expectException(QueryException::class);

        ClinicQueueEntry::create([
            'source_type' => 'walk_in',
            'queue_date' => $queueDate,
            'queue_sequence' => 1,
            'queue_number' => 'Q-001-DUP',
            'patient_name' => 'Duplicate',
            'status' => 'waiting',
            'queued_at' => now(),
        ]);
    }

    public function test_doctor_can_call_start_open_and_complete_booking_linked_queue_entry(): void
    {
        $this->travelTo(now()->setTime(9, 0));
        $booking = $this->createTodayOfflineBooking(['notes' => 'Interested in in-clinic treatment.']);

        $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.bookings.check-in', $booking));

        $entry = ClinicQueueEntry::where('booking_id', $booking->id)->firstOrFail();

        $this->actingAs($this->doctorUser)
            ->post(route('doctor.bookings.complete', $booking), ['notes' => 'Too early.'])
            ->assertRedirect(route('doctor.consultations.show', $booking))
            ->assertSessionHas('error');
        $this->assertEquals('confirmed', $booking->fresh()->status);

        $this->actingAs($this->doctorUser)
            ->get(route('doctor.queue.api'))
            ->assertOk()
            ->assertJsonPath('next.id', $entry->id)
            ->assertJsonPath('next.source_type', 'booking')
            ->assertJsonPath('current', null);

        $this->actingAs($this->doctorUser)
            ->post(route('doctor.queue.call', $entry))
            ->assertRedirect(route('doctor.dashboard'));

        $this->assertEquals('assigned', $entry->fresh()->status);
        $this->assertNotNull($entry->fresh()->called_at);

        $this->actingAs($this->doctorUser)
            ->post(route('doctor.queue.start', $entry))
            ->assertRedirect(route('doctor.consultations.show', $booking));

        $this->assertEquals('in_consultation', $entry->fresh()->status);

        $this->actingAs($this->doctorUser)
            ->get(route('doctor.consultations.show', $booking))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/ConsultationWorkspace')
                ->where('booking.source_type', 'booking')
                ->where('booking.queue.id', $entry->id)
                ->where('booking.queue.queue_number', 'Q-001')
                ->where('booking.can_complete', true));

        $this->actingAs($this->doctorUser)
            ->post(route('doctor.bookings.complete', $booking), ['notes' => 'Booking consultation completed.'])
            ->assertRedirect(route('doctor.consultations.index'));

        $this->assertEquals('completed', $booking->fresh()->status);
        $this->assertEquals('completed', $entry->fresh()->status);
        $this->assertDatabaseHas('consultations', [
            'booking_id' => $booking->id,
            'queue_entry_id' => $entry->id,
            'doctor_id' => $this->doctor->id,
            'notes' => 'Booking consultation completed.',
        ]);
    }

    public function test_other_doctor_cannot_access_booking_linked_queue_flow(): void
    {
        $this->travelTo(now()->setTime(9, 0));
        $otherDoctorUser = User::factory()->create(['role' => 'doctor', 'email_verified_at' => now()]);
        Doctor::create([
            'user_id' => $otherDoctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);
        $booking = $this->createTodayOfflineBooking();

        $this->actingAs($this->adminUser)
            ->patch(route('admin.queue.bookings.check-in', $booking));

        $entry = ClinicQueueEntry::where('booking_id', $booking->id)->firstOrFail();

        $this->actingAs($otherDoctorUser)
            ->post(route('doctor.queue.call', $entry))
            ->assertForbidden();
        $this->assertEquals('waiting', $entry->fresh()->status);

        $entry->update(['status' => 'assigned', 'called_at' => now(), 'assigned_at' => now()]);

        $this->actingAs($otherDoctorUser)
            ->post(route('doctor.queue.start', $entry))
            ->assertForbidden();

        $entry->update(['status' => 'in_consultation', 'consultation_started_at' => now()]);

        $this->actingAs($otherDoctorUser)
            ->get(route('doctor.consultations.show', $booking))
            ->assertForbidden();

        $this->actingAs($otherDoctorUser)
            ->post(route('doctor.bookings.complete', $booking), ['notes' => 'Should not save'])
            ->assertForbidden();

        $this->assertEquals('confirmed', $booking->fresh()->status);
        $this->assertEquals('in_consultation', $entry->fresh()->status);
        $this->assertDatabaseMissing('consultations', ['booking_id' => $booking->id]);
    }

    public function test_admin_queue_polling_endpoint(): void
    {
        $entry = ClinicQueueEntry::create([
            'queue_number' => 'Q-001',
            'patient_name' => 'Bob',
            'status' => 'waiting',
            'queued_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->get(route('admin.queue.api'));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'queue' => ['waiting', 'assigned', 'in_consultation'],
            'notArrivedBookings',
            'doctors',
            'summary',
        ]);
        $response->assertJsonFragment(['patient_name' => 'Bob']);
    }

    private function createTodayOfflineBooking(array $attributes = [], ?Doctor $doctor = null): Booking
    {
        $doctor ??= $this->doctor;
        $patient = $attributes['user_id'] ?? User::factory()->create(['role' => null, 'email_verified_at' => now()])->id;
        $startTime = now()->setTime(16, 0);
        $slot = TimeSlot::create([
            'doctor_id' => $doctor->id,
            'start_time' => $startTime,
            'end_time' => $startTime->copy()->addMinutes(30),
            'status' => 'booked',
        ]);

        return Booking::create([
            'user_id' => $patient,
            'booked_by_admin_id' => $this->adminUser->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'offline',
            'notes' => null,
            ...$attributes,
        ]);
    }
}
