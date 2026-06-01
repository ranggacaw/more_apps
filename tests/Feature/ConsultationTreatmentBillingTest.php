<?php

namespace Tests\Feature;

use App\Models\AestheticProgram;
use App\Models\Booking;
use App\Models\ClinicOperatingHour;
use App\Models\ConsultationPackageOption;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Models\User;
use App\Services\TimeSlotService;
use Database\Seeders\ConsultationTreatmentBillingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConsultationTreatmentBillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_manages_aesthetic_programs_with_margin_and_doctor_payload_hides_hpp(): void
    {
        Queue::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(16, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'self_service',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.aesthetic-programs.store'), [
                'name' => 'Bright Peel',
                'price' => 900000,
                'hpp_amount' => 300000,
                'is_active' => true,
            ])
            ->assertRedirect();

        $program = AestheticProgram::firstOrFail();

        $this->actingAs($admin)
            ->get(route('admin.aesthetic-programs.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AestheticPrograms')
                ->where('programs.0.gross_margin', 600000));

        $this->actingAs($admin)
            ->patch(route('admin.aesthetic-programs.update', $program), [
                'name' => 'Bright Peel Plus',
                'price' => 950000,
                'hpp_amount' => 350000,
                'is_active' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('aesthetic_programs', [
            'id' => $program->id,
            'name' => 'Bright Peel Plus',
            'is_active' => false,
        ]);

        $program->refresh()->update(['is_active' => true]);

        $this->actingAs($doctorUser)
            ->get(route('doctor.consultations.show', $booking))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/ConsultationWorkspace')
                ->has('aestheticPrograms.0.id')
                ->has('aestheticPrograms.0.name')
                ->has('aestheticPrograms.0.price')
                ->missing('aestheticPrograms.0.hpp_amount'));
    }

    public function test_doctor_completion_snapshots_treatments_and_creates_pending_internal_payment(): void
    {
        Queue::fake();
        $this->seed(ConsultationTreatmentBillingSeeder::class);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(16, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'self_service',
        ]);
        $program = AestheticProgram::create([
            'name' => 'Lift Booster',
            'price' => 800000,
            'hpp_amount' => 250000,
            'is_active' => true,
        ]);
        $diamond = ConsultationPackageOption::where('name', 'Diamond Trial')->firstOrFail();

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Treatment completed safely.',
                'recommended_package_id' => null,
                'package_option_id' => $diamond->id,
                'diamond_oral_addon' => true,
                'package_dosage_value' => null,
                'package_dosage_unit' => '',
                'aesthetic_program_lines' => [[
                    'aesthetic_program_id' => $program->id,
                    'quantity' => 2,
                    'dosage_value' => 1.5,
                    'dosage_unit' => 'ml',
                    'notes' => 'Cheeks',
                ]],
                'manual_treatment_lines' => [[
                    'name' => 'Manual Ampoule',
                    'quantity' => 1,
                    'unit_price' => 100000,
                    'dosage_value' => null,
                    'dosage_unit' => '',
                ]],
            ])
            ->assertRedirect(route('doctor.consultations.index'));

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'completed']);
        $this->assertDatabaseCount('consultation_line_items', 4);
        $this->assertDatabaseHas('consultation_line_items', [
            'type' => 'aesthetic_program',
            'name' => 'Lift Booster',
            'quantity' => 2,
            'unit_price' => 800000,
            'hpp_amount' => 250000,
            'line_total' => 1600000,
        ]);
        $this->assertDatabaseHas('consultation_line_items', [
            'type' => 'manual_treatment',
            'name' => 'Manual Ampoule',
            'dosage_unit' => 'ml',
        ]);
        $this->assertDatabaseHas('payments', [
            'user_id' => $patient->id,
            'booking_id' => $booking->id,
            'type' => 'consultation_treatment',
            'provider' => 'internal',
            'status' => 'pending',
            'amount' => 4200000,
            'hpp_amount' => 500000,
            'snap_token' => null,
        ]);
        $this->assertDatabaseMissing('user_packages', ['user_id' => $patient->id]);
    }

    public function test_diamond_addon_requires_diamond_primary_option(): void
    {
        $this->seed(ConsultationTreatmentBillingSeeder::class);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(16, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'self_service',
        ]);
        $basic = ConsultationPackageOption::where('name', 'Basic Trial')->firstOrFail();

        $this->actingAs($doctorUser)
            ->from(route('doctor.consultations.show', $booking))
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Treatment completed safely.',
                'package_option_id' => $basic->id,
                'diamond_oral_addon' => true,
            ])
            ->assertStatus(422);

        $this->assertDatabaseMissing('consultations', ['booking_id' => $booking->id]);
    }

    public function test_clinic_hours_filter_patient_slots_and_reject_outside_hours_lock(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-01 08:00:00'));
        $patient = User::factory()->create(['role' => 'patient']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        ClinicOperatingHour::create([
            'day_of_week' => 2,
            'start_time' => '16:00:00',
            'end_time' => '20:00:00',
            'is_active' => true,
        ]);

        $this->assertFalse(app(TimeSlotService::class)->isDateTimeRangeWithinClinicHours(
            Carbon::parse('2026-06-02 09:00:00'),
            Carbon::parse('2026-06-02 09:30:00'),
        ));
        $this->assertSame('2026-06-02 16:00:00', app(TimeSlotService::class)
            ->getReservableSlotsForDoctorAndDate($doctor, '2026-06-02', $patient->id)
            ->first()
            ?->start_time
            ?->toDateTimeString());

        $response = $this->actingAs($patient)
            ->getJson(route('api.slots', ['doctor_id' => $doctor->id, 'date' => '2026-06-02']))
            ->assertOk();

        $this->assertSame('16:00', $response->json('clinic_hours.0.start_time'));
        $outsideSlot = $this->createSlot($doctor, Carbon::parse('2026-06-02 15:00:00'));

        $this->actingAs($patient)
            ->postJson(route('slots.lock'), ['slot_id' => $outsideSlot->id])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Appointments are only available during clinic hours.');

        Carbon::setTestNow();
    }

    public function test_admin_outside_hours_booking_requires_reason_and_records_override(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-01 08:00:00'));
        $admin = User::factory()->create(['role' => 'admin']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => 'patient']);
        ClinicOperatingHour::create([
            'day_of_week' => 2,
            'start_time' => '16:00:00',
            'end_time' => '20:00:00',
            'is_active' => true,
        ]);
        $slot = $this->createSlot($doctor, Carbon::parse('2026-06-02 15:00:00'));

        $payload = [
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'consultation_mode' => 'offline',
            'patient_type' => 'registered',
            'user_id' => $patient->id,
            'override_clinic_hours' => true,
        ];

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), $payload)
            ->assertStatus(422);

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), $payload + ['override_reason' => 'Patient has urgent travel.'])
            ->assertRedirect(route('admin.bookings.index'));

        $this->assertDatabaseHas('schedule_override_logs', [
            'admin_user_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'reason' => 'Patient has urgent travel.',
        ]);

        Carbon::setTestNow();
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
