<?php

namespace Tests\Feature;

use App\Jobs\SendPatientAccountCreatedJob;
use App\Jobs\SendPatientPasswordRecoveryJob;
use App\Jobs\SendPatientReportAvailableJob;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Package;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\UserPackage;
use App\Services\PatientAccountService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PatientPortalMedicalReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_can_login_with_phone_and_must_change_temporary_password(): void
    {
        $service = app(PatientAccountService::class);
        $phone = '628123456789';
        $temporaryPassword = $service->temporaryPasswordForPhone($phone);
        $patient = User::factory()->patient()->create([
            'phone' => $phone,
            'password' => Hash::make($temporaryPassword),
            'must_change_password' => true,
        ]);

        $this->post(route('login'), [
            'email' => '0812-345-6789',
            'password' => $temporaryPassword,
        ])->assertRedirect(route('patient.password.edit', absolute: false));

        $this->assertAuthenticatedAs($patient);

        $this->actingAs($patient)
            ->get(route('patient.dashboard'))
            ->assertRedirect(route('patient.password.edit'));

        $this->actingAs($patient)
            ->put(route('patient.password.update'), [
                'current_password' => $temporaryPassword,
                'password' => 'new-secure-password',
                'password_confirmation' => 'new-secure-password',
            ])
            ->assertRedirect(route('patient.dashboard'));

        $this->assertFalse($patient->fresh()->must_change_password);
    }

    public function test_patient_password_recovery_queues_generic_phone_recovery(): void
    {
        Queue::fake();
        $patient = User::factory()->patient()->create(['phone' => '628111222333']);

        $this->post(route('password.email'), ['email' => '0811 1222 333'])
            ->assertSessionHas('status', 'If this patient account exists, recovery instructions will be sent shortly.');

        Queue::assertPushed(SendPatientPasswordRecoveryJob::class, fn (SendPatientPasswordRecoveryJob $job) => $job->userId === $patient->id);

        $this->post(route('password.email'), ['email' => '089999999999'])
            ->assertSessionHas('status', 'If this patient account exists, recovery instructions will be sent shortly.');
    }

    public function test_admin_can_provision_patient_account_and_duplicate_phone_links_existing_account(): void
    {
        Queue::fake();
        $admin = User::factory()->create(['role' => 'admin']);

        $payload = [
            'name' => 'Portal Patient',
            'email' => '',
            'phone' => '0812 0000 9999',
            'password' => '',
            'password_confirmation' => '',
            'role' => 'patient',
            'is_verified' => true,
        ];

        $this->actingAs($admin)->post(route('admin.users.store'), $payload)->assertRedirect();

        $patient = User::query()->where('phone', '6281200009999')->firstOrFail();
        $this->assertSame('patient', $patient->role);
        $this->assertTrue($patient->must_change_password);
        $this->assertSame('patient+6281200009999@more.local', $patient->email);
        Queue::assertPushed(SendPatientAccountCreatedJob::class, fn (SendPatientAccountCreatedJob $job) => $job->userId === $patient->id);

        $this->actingAs($admin)->post(route('admin.users.store'), [
            ...$payload,
            'name' => 'Duplicate Patient',
            'phone' => '6281200009999',
        ])->assertRedirect();

        $this->assertSame(1, User::query()->where('phone', '6281200009999')->count());
    }

    public function test_patient_cannot_access_operational_staff_routes(): void
    {
        $patient = User::factory()->patient()->create();

        $this->actingAs($patient)->get(route('doctor.dashboard'))->assertForbidden();
        $this->actingAs($patient)->get(route('admin.dashboard'))->assertForbidden();
        $this->actingAs($patient)->get(route('finance.profit-loss.index'))->assertForbidden();
        $this->actingAs($patient)->get(route('admin.queue.index'))->assertForbidden();
        $this->actingAs($patient)->get(route('admin.users.index'))->assertForbidden();
    }

    public function test_patient_reports_are_finalized_and_owned_by_signed_in_patient(): void
    {
        [$doctor] = $this->createDoctor();
        $patient = User::factory()->patient()->create();
        $otherPatient = User::factory()->patient()->create();

        $finalized = Consultation::factory()->create([
            'booking_id' => null,
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'notes' => 'Visible report notes.',
            'patient_instructions' => 'Drink water.',
            'next_control_date' => now()->addWeek()->toDateString(),
            'patient_report_status' => 'finalized',
            'patient_report_finalized_at' => now(),
            'slimming_weight_kg' => 61,
            'slimming_bmi' => 22.5,
        ]);

        $draft = Consultation::factory()->create([
            'booking_id' => null,
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'patient_report_status' => 'draft',
            'patient_report_finalized_at' => null,
        ]);

        $other = Consultation::factory()->create([
            'booking_id' => null,
            'user_id' => $otherPatient->id,
            'doctor_id' => $doctor->id,
            'patient_report_status' => 'finalized',
            'patient_report_finalized_at' => now(),
        ]);

        $this->actingAs($patient)
            ->get(route('patient.reports.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/Reports')
                ->has('reports', 1)
                ->where('reports.0.id', $finalized->id));

        $this->actingAs($patient)
            ->get(route('patient.reports.show', $finalized))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/ReportDetail')
                ->where('report.id', $finalized->id)
                ->where('report.metrics.weight_kg', 61));

        $this->actingAs($patient)->get(route('patient.reports.show', $draft))->assertNotFound();
        $this->actingAs($patient)->get(route('patient.reports.show', $other))->assertNotFound();
    }

    public function test_patient_progress_combines_finalized_reports_and_weekly_check_ins(): void
    {
        [$doctor] = $this->createDoctor();
        $patient = User::factory()->patient()->create();
        $package = Package::create([
            'name' => 'Slimming',
            'slug' => 'slimming',
            'price' => 1000000,
            'consultation_credits' => 4,
            'is_active' => true,
        ]);
        $userPackage = UserPackage::create([
            'user_id' => $patient->id,
            'package_id' => $package->id,
            'status' => 'active',
            'consultation_credits_total' => 4,
            'consultation_credits_remaining' => 3,
            'activated_at' => now()->subWeeks(2),
        ]);

        Consultation::factory()->create([
            'booking_id' => null,
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'patient_report_status' => 'finalized',
            'patient_report_finalized_at' => now()->subWeek(),
            'completed_at' => now()->subWeek(),
            'slimming_weight_kg' => 64,
            'slimming_waist_cm' => 80,
        ]);
        CheckIn::create([
            'user_package_id' => $userPackage->id,
            'user_id' => $patient->id,
            'program_week' => 2,
            'weight_kg' => 63,
            'waist_cm' => 78,
            'checked_in_at' => now(),
        ]);

        $this->actingAs($patient)
            ->get(route('patient.progress'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/Progress')
                ->has('metrics.weight', 2)
                ->where('metrics.weight.0.value', 64)
                ->where('metrics.weight.1.value', 63)
                ->has('metrics.waist', 2));
    }

    public function test_doctor_completion_finalizes_patient_visible_report_and_queues_notification(): void
    {
        Queue::fake();
        [$doctor, $doctorUser] = $this->createDoctor();
        $patient = User::factory()->patient()->create();
        $slot = TimeSlot::factory()->create(['doctor_id' => $doctor->id, 'status' => 'booked']);
        $booking = Booking::factory()->create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'online',
            'meeting_link' => 'https://meet.google.com/abc-defg-hij',
        ]);

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Patient is improving.',
                'patient_instructions' => 'Continue meal plan.',
                'next_control_date' => now()->addWeek()->toDateString(),
                'slimming_weight_kg' => 60.5,
                'finalize_patient_report' => true,
            ])
            ->assertRedirect(route('doctor.consultations.index'));

        $this->assertDatabaseHas('consultations', [
            'booking_id' => $booking->id,
            'user_id' => $patient->id,
            'patient_report_status' => 'finalized',
            'patient_instructions' => 'Continue meal plan.',
        ]);
        Queue::assertPushed(SendPatientReportAvailableJob::class);
    }

    private function createDoctor(): array
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        return [$doctor, $doctorUser];
    }
}
