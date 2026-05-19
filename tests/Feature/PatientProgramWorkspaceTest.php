<?php

namespace Tests\Feature;

use App\Jobs\SendUserPackageNotificationJob;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Package;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\UserPackage;
use App\Services\ProgramReminderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PatientProgramWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_dashboard_shows_active_program_data_in_week_order_with_temporary_asset_urls(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));
        Storage::fake('clinic-assets');
        Storage::disk('clinic-assets')->buildTemporaryUrlsUsing(fn (string $path) => 'https://temp.example/'.$path);
        config(['clinic.asset_disk' => 'clinic-assets']);

        try {
            $patient = User::factory()->create([
                'role' => 'patient',
                'name' => 'Alya Program',
                'phone' => '620000001001',
                'date_of_birth' => '1996-04-11',
                'address' => 'Jakarta',
                'medical_notes' => 'Sensitive skin and hydration focus.',
            ]);
            [$doctorUser, $doctor] = $this->createDoctor();
            [$package, $userPackage, $booking, $consultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(10));

            $mealPlanPath = 'clinic/meal-plans/consultation-'.$consultation->id.'.pdf';
            $photoPath = 'clinic/check-ins/check-in-1/progress-photos/week-2.jpg';

            Storage::disk('clinic-assets')->put($mealPlanPath, 'meal plan');
            Storage::disk('clinic-assets')->put($photoPath, 'photo');

            $consultation->update(['meal_plan_pdf_path' => $mealPlanPath]);

            CheckIn::create([
                'user_package_id' => $userPackage->id,
                'consultation_id' => $consultation->id,
                'user_id' => $patient->id,
                'program_week' => 2,
                'weight_kg' => 54.3,
                'waist_cm' => 69.4,
                'notes' => 'Week two notes.',
                'progress_photo_path' => $photoPath,
                'review_notes' => 'Keep the same pace.',
                'doctor_id' => $doctor->id,
                'checked_in_at' => now()->subDay(),
                'reviewed_at' => now()->subHours(12),
            ]);

            CheckIn::create([
                'user_package_id' => $userPackage->id,
                'consultation_id' => $consultation->id,
                'user_id' => $patient->id,
                'program_week' => 1,
                'weight_kg' => 55.0,
                'waist_cm' => 70.0,
                'notes' => 'Week one notes.',
                'checked_in_at' => now()->subDays(8),
            ]);

            $this->actingAs($patient)
                ->get(route('patient.dashboard'))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Patient/Dashboard')
                    ->where('stats.activePackages', 1)
                    ->where('profileContext.medical_notes', 'Sensitive skin and hydration focus.')
                    ->where('activePackages.0.name', $package->name)
                    ->where('activePackages.0.current_program_week', 2)
                    ->where('activePackages.0.current_week_submitted', true)
                    ->where('activePackages.0.meal_plan.url', 'https://temp.example/'.$mealPlanPath)
                    ->where('activePackages.0.progress_history.0.program_week', 1)
                    ->where('activePackages.0.progress_history.1.program_week', 2)
                    ->where('activePackages.0.progress_history.1.progress_photo.url', 'https://temp.example/'.$photoPath)
                    ->where('activePackages.0.latest_review.review_notes', 'Keep the same pace.')
                    ->where('engagementFeed.0.title', 'Upcoming confirmed consultation'));
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_patient_weekly_check_in_submission_requires_an_owned_active_package_and_prevents_duplicates(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));
        Storage::fake('clinic-assets');
        config(['clinic.asset_disk' => 'clinic-assets']);

        try {
            $patient = User::factory()->create(['role' => 'patient']);
            $otherPatient = User::factory()->create(['role' => 'patient']);
            [$doctorUser, $doctor] = $this->createDoctor();
            [, $userPackage] = $this->createCompletedProgram($patient, $doctor, now()->subDays(2));

            $this->actingAs($patient)
                ->from(route('patient.dashboard'))
                ->post(route('patient.program.check-ins.store', $userPackage), [
                    'weight_kg' => 55.4,
                    'waist_cm' => 70.1,
                    'notes' => 'Steady progress.',
                    'progress_photo' => UploadedFile::fake()->image('progress.jpg'),
                ])
                ->assertRedirect(route('patient.dashboard'));

            $checkIn = CheckIn::query()->where('user_package_id', $userPackage->id)->first();

            $this->assertNotNull($checkIn);
            $this->assertSame(1, $checkIn->program_week);
            $this->assertNotNull($checkIn->progress_photo_path);
            $this->assertSame(3, $userPackage->fresh()->consultation_credits_remaining);
            Storage::disk('clinic-assets')->assertExists($checkIn->progress_photo_path);

            $this->actingAs($patient)
                ->post(route('patient.program.check-ins.store', $userPackage), [
                    'weight_kg' => 55.1,
                    'waist_cm' => 69.8,
                ])
                ->assertStatus(422);

            $this->actingAs($otherPatient)
                ->post(route('patient.program.check-ins.store', $userPackage), [
                    'weight_kg' => 55.1,
                    'waist_cm' => 69.8,
                ])
                ->assertForbidden();

            $inactivePackage = UserPackage::query()->create([
                'user_id' => $patient->id,
                'package_id' => $userPackage->package_id,
                'status' => 'completed',
                'consultation_credits_total' => 1,
                'consultation_credits_remaining' => 0,
                'activated_at' => now()->subDays(1),
            ]);

            $this->actingAs($patient)
                ->post(route('patient.program.check-ins.store', $inactivePackage), [
                    'weight_kg' => 55.1,
                    'waist_cm' => 69.8,
                ])
                ->assertStatus(422);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_doctor_dashboard_only_lists_active_programs_for_completed_consultations_they_own(): void
    {
        $patientA = User::factory()->create(['role' => 'patient', 'name' => 'Patient A']);
        $patientB = User::factory()->create(['role' => 'patient', 'name' => 'Patient B']);
        [$doctorUser, $doctor] = $this->createDoctor();
        [$otherDoctorUser, $otherDoctor] = $this->createDoctor();

        [, $ownedPackage] = $this->createCompletedProgram($patientA, $doctor, now()->subDays(6));
        [, $otherPackage] = $this->createCompletedProgram($patientB, $otherDoctor, now()->subDays(6));

        $otherPackage->update(['status' => 'active']);

        $this->actingAs($doctorUser)
            ->get(route('doctor.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/Dashboard')
                ->has('activePrograms', 1)
                ->where('activePrograms.0.id', $ownedPackage->id)
                ->where('activePrograms.0.patient.name', 'Patient A'));
    }

    public function test_doctor_review_requires_program_ownership_and_persists_review_for_the_patient_workspace(): void
    {
        Queue::fake([SendUserPackageNotificationJob::class]);
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));

        try {
            $patient = User::factory()->create(['role' => 'patient']);
            [$doctorUser, $doctor] = $this->createDoctor();
            [$otherDoctorUser] = $this->createDoctor();
            [, $userPackage, , $consultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(2));

            $checkIn = CheckIn::create([
                'user_package_id' => $userPackage->id,
                'consultation_id' => $consultation->id,
                'user_id' => $patient->id,
                'program_week' => 1,
                'weight_kg' => 55.3,
                'waist_cm' => 70.2,
                'notes' => 'Need doctor review.',
                'checked_in_at' => now()->subHour(),
            ]);

            $this->actingAs($otherDoctorUser)
                ->post(route('doctor.program.check-ins.review', $checkIn), ['review_notes' => 'Unauthorized'])
                ->assertForbidden();

            $this->actingAs($doctorUser)
                ->from(route('doctor.dashboard'))
                ->post(route('doctor.program.check-ins.review', $checkIn), ['review_notes' => 'Increase hydration and keep the same routine.'])
                ->assertRedirect(route('doctor.dashboard'));

            $this->assertDatabaseHas('check_ins', [
                'id' => $checkIn->id,
                'doctor_id' => $doctor->id,
                'review_notes' => 'Increase hydration and keep the same routine.',
            ]);
            $this->assertNotNull($checkIn->fresh()->reviewed_at);

            Queue::assertPushed(SendUserPackageNotificationJob::class, fn (SendUserPackageNotificationJob $job) => $job->type === 'weekly-review-available' && $job->checkInId === $checkIn->id);

            $this->actingAs($patient)
                ->get(route('patient.dashboard'))
                ->assertInertia(fn (Assert $page) => $page
                    ->where('activePackages.0.progress_history.0.review_notes', 'Increase hydration and keep the same routine.')
                    ->where('activePackages.0.progress_history.0.reviewed_by', $doctor->user->name));
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_weekly_reminder_service_queues_due_active_packages_once_per_week(): void
    {
        Queue::fake([SendUserPackageNotificationJob::class]);
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));

        try {
            $patient = User::factory()->create(['role' => 'patient']);
            [$doctorUser, $doctor] = $this->createDoctor();
            [, $duePackage] = $this->createCompletedProgram($patient, $doctor, now()->subDays(8));
            [, $submittedPackage, , $consultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(8));

            CheckIn::create([
                'user_package_id' => $submittedPackage->id,
                'consultation_id' => $consultation->id,
                'user_id' => $patient->id,
                'program_week' => 2,
                'weight_kg' => 55.3,
                'waist_cm' => 70.0,
                'checked_in_at' => now()->subHour(),
            ]);

            $service = app(ProgramReminderService::class);

            $this->assertSame(1, $service->queueWeeklyCheckInReminders());
            $this->assertSame(0, $service->queueWeeklyCheckInReminders());

            Queue::assertPushed(SendUserPackageNotificationJob::class, 1);
            Queue::assertPushed(SendUserPackageNotificationJob::class, fn (SendUserPackageNotificationJob $job) => $job->type === 'weekly-check-in-reminder' && $job->userPackage->is($duePackage));
            $this->assertSame([2], $duePackage->fresh()->metadata['weekly_reminder_weeks']);
        } finally {
            Carbon::setTestNow();
        }
    }

    /**
     * @return array{0: User, 1: Doctor}
     */
    private function createDoctor(): array
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

    /**
     * @return array{0: Package, 1: UserPackage, 2: Booking, 3: Consultation}
     */
    private function createCompletedProgram(User $patient, Doctor $doctor, Carbon $activatedAt): array
    {
        $slotOffset = TimeSlot::query()->count();
        $package = Package::create([
            'name' => 'Recovery Plan '.uniqid(),
            'slug' => 'recovery-plan-'.uniqid(),
            'price' => 900000,
            'consultation_credits' => 3,
            'is_active' => true,
        ]);

        $slot = TimeSlot::create([
            'doctor_id' => $doctor->id,
            'start_time' => now()->addDay()->setTime(10 + $slotOffset, 0),
            'end_time' => now()->addDay()->setTime(10 + $slotOffset, 30),
            'status' => 'booked',
        ]);

        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
        ]);

        $userPackage = UserPackage::create([
            'user_id' => $patient->id,
            'package_id' => $package->id,
            'status' => 'active',
            'consultation_credits_total' => 3,
            'consultation_credits_remaining' => 3,
            'activated_at' => $activatedAt,
        ]);

        $consultation = Consultation::create([
            'booking_id' => $booking->id,
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'user_package_id' => $userPackage->id,
            'notes' => 'Completed consultation.',
            'completed_at' => now()->subDays(12),
        ]);

        return [$package, $userPackage, $booking, $consultation];
    }
}
