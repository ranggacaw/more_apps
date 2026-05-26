<?php

namespace Tests\Feature;

use App\Models\ClinicQueueEntry;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
            'status' => 'assigned',
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

    public function test_doctor_can_start_and_complete_consultation(): void
    {
        $entry = ClinicQueueEntry::create([
            'queue_number' => 'Q-001',
            'patient_name' => 'Bob',
            'status' => 'assigned',
            'doctor_id' => $this->doctor->id,
            'queued_at' => now(),
            'assigned_at' => now(),
        ]);

        // Start consultation
        $response1 = $this->actingAs($this->doctorUser)
            ->post(route('doctor.queue.start', $entry));
        
        $response1->assertRedirect();
        $this->assertEquals('in_consultation', $entry->fresh()->status);
        $this->assertNotNull($entry->fresh()->consultation_started_at);

        // Complete consultation
        $response2 = $this->actingAs($this->doctorUser)
            ->post(route('doctor.queue.done', $entry));
        
        $response2->assertRedirect();
        $this->assertEquals('completed', $entry->fresh()->status);
        $this->assertNotNull($entry->fresh()->completed_at);
    }

    public function test_only_assigned_doctor_can_start_or_complete_consultation(): void
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
            'doctors'
        ]);
        $response->assertJsonFragment(['patient_name' => 'Bob']);
    }
}
