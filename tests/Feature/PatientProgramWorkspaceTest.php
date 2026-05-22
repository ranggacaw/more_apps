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

    public function test_patient_medical_records_page_requires_a_verified_patient_and_exposes_owned_record_details(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));
        Storage::fake('clinic-assets');
        Storage::disk('clinic-assets')->buildTemporaryUrlsUsing(fn (string $path) => 'https://temp.example/'.$path);
        config(['clinic.asset_disk' => 'clinic-assets']);

        try {
            $patient = User::factory()->create(['role' => 'patient', 'name' => 'Archive Patient']);
            $unverifiedPatient = User::factory()->unverified()->create(['role' => 'patient']);
            [$doctorUser, $doctor] = $this->createDoctor();
            [, $userPackage, $booking, $consultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(21));

            $mealPlanPath = 'clinic/meal-plans/consultation-'.$consultation->id.'.pdf';
            $uploadPath = 'clinic/patient-uploads/booking-'.$booking->id.'/intake.pdf';
            $photoPath = 'clinic/check-ins/check-in-archive/progress-photos/week-1.jpg';
            $supportingPath = 'clinic/check-ins/check-in-archive/report.pdf';

            Storage::disk('clinic-assets')->put($mealPlanPath, 'meal plan');
            Storage::disk('clinic-assets')->put($uploadPath, 'intake');
            Storage::disk('clinic-assets')->put($photoPath, 'photo');
            Storage::disk('clinic-assets')->put($supportingPath, 'supporting');

            $booking->update([
                'notes' => 'Patient shared an intake summary before the consultation.',
                'patient_upload_path' => $uploadPath,
            ]);

            $consultation->update([
                'notes' => 'Consultation archive note for hydration recovery.',
                'meal_plan_pdf_path' => $mealPlanPath,
                'completed_at' => now()->subDays(8),
            ]);

            CheckIn::create([
                'user_package_id' => $userPackage->id,
                'consultation_id' => $consultation->id,
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'program_week' => 1,
                'weight_kg' => 55.1,
                'waist_cm' => 69.8,
                'notes' => 'Patient weekly record entry.',
                'review_notes' => 'Doctor review for the weekly archive entry.',
                'progress_photo_path' => $photoPath,
                'supporting_document_path' => $supportingPath,
                'checked_in_at' => now()->subDays(2),
                'reviewed_at' => now()->subDay(),
            ]);

            $this->actingAs($patient)
                ->get(route('patient.medical-records.index'))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Patient/MedicalRecords')
                    ->has('records', 2)
                    ->where('stats.total_records', 2)
                    ->where('stats.attachment_count', 4)
                    ->where('records.0.category', 'progress')
                    ->where('records.0.review_note', 'Doctor review for the weekly archive entry.')
                    ->where('records.0.attachments.0.url', 'https://temp.example/'.$photoPath)
                    ->where('records.1.category', 'consultation')
                    ->where('records.1.full_note', 'Consultation archive note for hydration recovery.')
                    ->where('records.1.intake_notes', 'Patient shared an intake summary before the consultation.')
                    ->where('records.1.attachments.0.url', 'https://temp.example/'.$mealPlanPath)
                    ->where('records.1.attachments.1.url', 'https://temp.example/'.$uploadPath));

            $this->actingAs($unverifiedPatient)
                ->get(route('patient.medical-records.index'))
                ->assertRedirect(route('verification.notice'));

            $this->actingAs($doctorUser)
                ->get(route('patient.medical-records.index'))
                ->assertForbidden();
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_patient_medical_records_page_only_lists_the_signed_in_patients_archive(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);
        $otherPatient = User::factory()->create(['role' => 'patient']);
        [$doctorUser, $doctor] = $this->createDoctor();
        [, , , $ownedConsultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(14));
        [, , , $otherConsultation] = $this->createCompletedProgram($otherPatient, $doctor, now()->subDays(14));

        $ownedConsultation->update(['notes' => 'Owned patient archive note.']);
        $otherConsultation->update(['notes' => 'Other patient archive note.']);

        $this->actingAs($patient)
            ->get(route('patient.medical-records.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/MedicalRecords')
                ->has('records', 1)
                ->where('records.0.full_note', 'Owned patient archive note.')
                ->where('stats.total_records', 1));
    }

    public function test_patient_medical_records_page_supports_an_empty_state(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($patient)
            ->get(route('patient.medical-records.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/MedicalRecords')
                ->has('records', 0)
                ->where('stats.total_records', 0)
                ->where('stats.consultation_records', 0)
                ->where('stats.progress_records', 0)
                ->where('stats.attachment_count', 0));
    }

    public function test_patient_medical_records_filters_search_category_and_date_window(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));

        try {
            $patient = User::factory()->create(['role' => 'patient']);
            [$doctorUser, $doctor] = $this->createDoctor();
            [, $recentPackage, , $recentConsultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(14));
            [, , , $olderConsultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(140));

            $recentConsultation->update([
                'notes' => 'Hydration-focused consultation note.',
                'completed_at' => now()->subDays(10),
            ]);

            $olderConsultation->update([
                'notes' => 'Older archive note outside the default recent window.',
                'completed_at' => now()->subDays(120),
            ]);

            CheckIn::create([
                'user_package_id' => $recentPackage->id,
                'consultation_id' => $recentConsultation->id,
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'program_week' => 2,
                'notes' => 'Weekly progress update.',
                'review_notes' => 'Doctor said progress is steady.',
                'checked_in_at' => now()->subDays(3),
                'reviewed_at' => now()->subDays(2),
            ]);

            $this->actingAs($patient)
                ->get(route('patient.medical-records.index', ['search' => 'hydration']))
                ->assertInertia(fn (Assert $page) => $page
                    ->has('records', 1)
                    ->where('filters.search', 'hydration')
                    ->where('records.0.category', 'consultation')
                    ->where('records.0.full_note', 'Hydration-focused consultation note.'));

            $this->actingAs($patient)
                ->get(route('patient.medical-records.index', ['category' => 'progress']))
                ->assertInertia(fn (Assert $page) => $page
                    ->has('records', 1)
                    ->where('filters.category', 'progress')
                    ->where('records.0.category', 'progress')
                    ->where('records.0.review_note', 'Doctor said progress is steady.'));

            $this->actingAs($patient)
                ->get(route('patient.medical-records.index', ['date_window' => 'last_30_days']))
                ->assertInertia(fn (Assert $page) => $page
                    ->has('records', 2)
                    ->where('filters.date_window', 'last_30_days')
                    ->where('stats.total_records', 2));
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

    public function test_doctor_medical_records_page_requires_a_verified_doctor_and_exposes_owned_patient_records(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));
        Storage::fake('clinic-assets');
        Storage::disk('clinic-assets')->buildTemporaryUrlsUsing(fn (string $path) => 'https://temp.example/'.$path);
        config(['clinic.asset_disk' => 'clinic-assets']);

        try {
            $patient = User::factory()->create(['role' => 'patient', 'name' => 'Archive Patient']);
            [$doctorUser, $doctor] = $this->createDoctor();
            $unverifiedDoctorUser = User::factory()->unverified()->create(['role' => 'doctor']);
            Doctor::create([
                'user_id' => $unverifiedDoctorUser->id,
                'specialization' => 'Aesthetic Medicine',
                'consultation_fee' => 500000,
                'is_active' => true,
            ]);
            [, $userPackage, $booking, $consultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(21));

            $mealPlanPath = 'clinic/meal-plans/consultation-'.$consultation->id.'.pdf';
            $uploadPath = 'clinic/patient-uploads/booking-'.$booking->id.'/intake.pdf';
            $photoPath = 'clinic/check-ins/check-in-doctor-archive/progress-photos/week-1.jpg';
            $supportingPath = 'clinic/check-ins/check-in-doctor-archive/report.pdf';

            Storage::disk('clinic-assets')->put($mealPlanPath, 'meal plan');
            Storage::disk('clinic-assets')->put($uploadPath, 'intake');
            Storage::disk('clinic-assets')->put($photoPath, 'photo');
            Storage::disk('clinic-assets')->put($supportingPath, 'supporting');

            $booking->update([
                'notes' => 'Patient shared an intake summary before the consultation.',
                'patient_upload_path' => $uploadPath,
            ]);

            $consultation->update([
                'notes' => 'Consultation archive note for hydration recovery.',
                'meal_plan_pdf_path' => $mealPlanPath,
                'completed_at' => now()->subDays(8),
            ]);

            CheckIn::create([
                'user_package_id' => $userPackage->id,
                'consultation_id' => $consultation->id,
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'program_week' => 1,
                'weight_kg' => 55.1,
                'waist_cm' => 69.8,
                'notes' => 'Patient weekly record entry.',
                'review_notes' => 'Doctor review for the weekly archive entry.',
                'progress_photo_path' => $photoPath,
                'supporting_document_path' => $supportingPath,
                'checked_in_at' => now()->subDays(2),
                'reviewed_at' => now()->subDay(),
            ]);

            $this->actingAs($doctorUser)
                ->get(route('doctor.medical-records.index'))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Doctor/MedicalRecords')
                    ->has('records', 2)
                    ->where('stats.total_records', 2)
                    ->where('stats.patient_count', 1)
                    ->where('records.0.category', 'progress')
                    ->where('records.0.patient.name', 'Archive Patient')
                    ->where('records.0.review_note', 'Doctor review for the weekly archive entry.')
                    ->where('records.0.attachments.0.url', 'https://temp.example/'.$photoPath)
                    ->where('records.1.category', 'consultation')
                    ->where('records.1.full_note', 'Consultation archive note for hydration recovery.')
                    ->where('records.1.intake_notes', 'Patient shared an intake summary before the consultation.')
                    ->where('records.1.attachments.0.url', 'https://temp.example/'.$mealPlanPath)
                    ->where('records.1.attachments.1.url', 'https://temp.example/'.$uploadPath));

            $this->actingAs($unverifiedDoctorUser)
                ->get(route('doctor.medical-records.index'))
                ->assertRedirect(route('verification.notice'));

            $this->actingAs($patient)
                ->get(route('doctor.medical-records.index'))
                ->assertForbidden();
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_doctor_medical_records_page_only_lists_the_signed_in_doctors_archive_and_supports_filters(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));

        try {
            $patient = User::factory()->create(['role' => 'patient', 'name' => 'Hydration Patient']);
            $otherPatient = User::factory()->create(['role' => 'patient', 'name' => 'Other Patient']);
            [$doctorUser, $doctor] = $this->createDoctor();
            [$otherDoctorUser, $otherDoctor] = $this->createDoctor();
            [, $recentPackage, , $recentConsultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(14));
            [, , , $olderConsultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(140));
            [, $otherPackage, , $otherDoctorConsultation] = $this->createCompletedProgram($otherPatient, $otherDoctor, now()->subDays(10));

            $recentConsultation->update([
                'notes' => 'Hydration-focused consultation note.',
                'completed_at' => now()->subDays(10),
            ]);

            $olderConsultation->update([
                'notes' => 'Older archive note outside the default recent window.',
                'completed_at' => now()->subDays(120),
            ]);

            $otherDoctorConsultation->update([
                'notes' => 'Other doctor archive note.',
                'completed_at' => now()->subDays(5),
            ]);

            CheckIn::create([
                'user_package_id' => $recentPackage->id,
                'consultation_id' => $recentConsultation->id,
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'program_week' => 2,
                'notes' => 'Weekly progress update.',
                'review_notes' => 'Doctor said progress is steady.',
                'checked_in_at' => now()->subDays(3),
                'reviewed_at' => now()->subDays(2),
            ]);

            CheckIn::create([
                'user_package_id' => $otherPackage->id,
                'consultation_id' => $otherDoctorConsultation->id,
                'user_id' => $otherPatient->id,
                'doctor_id' => $otherDoctor->id,
                'program_week' => 1,
                'notes' => 'Other doctor progress.',
                'checked_in_at' => now()->subDay(),
            ]);

            $this->actingAs($doctorUser)
                ->get(route('doctor.medical-records.index'))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Doctor/MedicalRecords')
                    ->has('records', 3)
                    ->where('stats.total_records', 3)
                    ->where('records.0.patient.name', 'Hydration Patient')
                    ->missing('records.3'));

            $this->actingAs($doctorUser)
                ->get(route('doctor.medical-records.index', ['search' => 'hydration-focused']))
                ->assertInertia(fn (Assert $page) => $page
                    ->has('records', 1)
                    ->where('filters.search', 'hydration-focused')
                    ->where('records.0.category', 'consultation')
                    ->where('records.0.full_note', 'Hydration-focused consultation note.'));

            $this->actingAs($doctorUser)
                ->get(route('doctor.medical-records.index', ['patient_name' => 'hydration']))
                ->assertInertia(fn (Assert $page) => $page
                    ->has('records', 3)
                    ->where('filters.patient_name', 'hydration')
                    ->where('records.0.patient.name', 'Hydration Patient')
                    ->where('records.2.patient.name', 'Hydration Patient'));

            $this->actingAs($doctorUser)
                ->get(route('doctor.medical-records.index', ['category' => 'progress']))
                ->assertInertia(fn (Assert $page) => $page
                    ->has('records', 1)
                    ->where('filters.category', 'progress')
                    ->where('records.0.category', 'progress')
                    ->where('records.0.review_note', 'Doctor said progress is steady.'));

            $this->actingAs($doctorUser)
                ->get(route('doctor.medical-records.index', ['date_window' => 'last_30_days']))
                ->assertInertia(fn (Assert $page) => $page
                    ->has('records', 2)
                    ->where('filters.date_window', 'last_30_days')
                    ->where('stats.total_records', 2));
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_doctor_medical_records_page_paginates_archive_results_in_batches_of_ten(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));

        try {
            $patient = User::factory()->create(['role' => 'patient', 'name' => 'Paginated Patient']);
            [$doctorUser, $doctor] = $this->createDoctor();

            foreach (range(1, 11) as $index) {
                [, , , $consultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays($index + 2));

                $consultation->update([
                    'notes' => 'Paginated archive note '.$index.'.',
                    'completed_at' => now()->subDays($index),
                ]);
            }

            $this->actingAs($doctorUser)
                ->get(route('doctor.medical-records.index'))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Doctor/MedicalRecords')
                    ->has('records', 10)
                    ->where('pagination.current_page', 1)
                    ->where('pagination.last_page', 2)
                    ->where('pagination.per_page', 10)
                    ->where('pagination.total', 11)
                    ->where('pagination.from', 1)
                    ->where('pagination.to', 10)
                    ->where('records.0.full_note', 'Paginated archive note 1.')
                    ->where('records.9.full_note', 'Paginated archive note 10.'));

            $this->actingAs($doctorUser)
                ->get(route('doctor.medical-records.index', ['page' => 2]))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Doctor/MedicalRecords')
                    ->has('records', 1)
                    ->where('pagination.current_page', 2)
                    ->where('pagination.last_page', 2)
                    ->where('pagination.total', 11)
                    ->where('pagination.from', 11)
                    ->where('pagination.to', 11)
                    ->where('records.0.full_note', 'Paginated archive note 11.'));
        } finally {
            Carbon::setTestNow();
        }
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

    public function test_doctor_can_fully_update_owned_program_progress_without_admin_involvement(): void
    {
        Storage::fake('clinic-assets');
        Storage::disk('clinic-assets')->buildTemporaryUrlsUsing(fn (string $path) => 'https://temp.example/'.$path);
        config(['clinic.asset_disk' => 'clinic-assets']);

        $patient = User::factory()->create(['role' => 'patient']);
        [$doctorUser, $doctor] = $this->createDoctor();
        [$otherDoctorUser] = $this->createDoctor();
        [, $userPackage, , $consultation] = $this->createCompletedProgram($patient, $doctor, now()->subDays(14));

        $checkIn = CheckIn::create([
            'user_package_id' => $userPackage->id,
            'consultation_id' => $consultation->id,
            'user_id' => $patient->id,
            'program_week' => 2,
            'weight_kg' => 55.3,
            'waist_cm' => 70.2,
            'notes' => 'Original weekly note.',
            'checked_in_at' => now()->subDay(),
        ]);

        $this->actingAs($otherDoctorUser)
            ->patch(route('doctor.program.check-ins.update', $checkIn), [
                'weight_kg' => 54.7,
                'waist_cm' => 69.1,
            ])
            ->assertForbidden();

        $this->actingAs($doctorUser)
            ->from(route('doctor.medical-records.index'))
            ->patch(route('doctor.program.check-ins.update', $checkIn), [
                'weight_kg' => 54.7,
                'waist_cm' => 69.1,
                'notes' => 'Updated weekly note.',
                'review_notes' => 'Adjusted the target and confirmed next steps.',
                'progress_photo' => UploadedFile::fake()->image('week-2.jpg'),
                'supporting_document' => UploadedFile::fake()->create('week-2-report.pdf', 120, 'application/pdf'),
            ])
            ->assertRedirect(route('doctor.medical-records.index'));

        $this->assertDatabaseHas('check_ins', [
            'id' => $checkIn->id,
            'doctor_id' => $doctor->id,
            'weight_kg' => 54.7,
            'waist_cm' => 69.1,
            'notes' => 'Updated weekly note.',
            'review_notes' => 'Adjusted the target and confirmed next steps.',
        ]);
        $this->assertNotNull($checkIn->fresh()->reviewed_at);
        $this->assertNotNull($checkIn->fresh()->progress_photo_path);
        $this->assertNotNull($checkIn->fresh()->supporting_document_path);

        $this->actingAs($doctorUser)
            ->patch(route('doctor.program.check-ins.update', $checkIn), [
                'weight_kg' => 54.7,
                'waist_cm' => 69.1,
                'notes' => 'Updated weekly note.',
                'review_notes' => '',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('check_ins', [
            'id' => $checkIn->id,
            'review_notes' => null,
        ]);
        $this->assertNull($checkIn->fresh()->reviewed_at);

        $this->actingAs($patient)
            ->get(route('patient.medical-records.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('records.0.full_note', 'Updated weekly note.')
                ->where('records.0.weight_kg', 54.7)
                ->where('records.0.waist_cm', 69.1));
    }

    public function test_admin_program_check_in_endpoint_is_not_available(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/admin/user-packages/1/check-ins', [])
            ->assertNotFound();
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
