<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\User;
use App\Services\ClinicAssetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DoctorProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_doctor_must_upload_photo_when_profile_has_no_existing_avatar(): void
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);

        Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        $this->actingAs($doctorUser)
            ->patch(route('profile.update'), [
                'name' => 'Dr. Without Photo',
                'email' => $doctorUser->email,
                'phone' => $doctorUser->phone,
            ])
            ->assertSessionHasErrors('avatar');
    }

    public function test_doctor_can_upload_profile_photo_from_profile_settings(): void
    {
        Storage::fake('clinic-assets');
        config(['clinic.asset_disk' => 'clinic-assets']);

        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctorProfile = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        $this->actingAs($doctorUser)
            ->patch(route('profile.update'), [
                'name' => 'Dr. With Photo',
                'email' => $doctorUser->email,
                'phone' => $doctorUser->phone,
                'avatar' => UploadedFile::fake()->image('doctor-profile.jpg'),
            ])
            ->assertRedirect(route('profile.edit'));

        $this->assertNotNull($doctorProfile->fresh()->avatar_url);
        Storage::disk('clinic-assets')->assertExists($doctorProfile->fresh()->avatar_url);
    }

    public function test_public_doctor_avatar_urls_are_served_through_the_application_when_temporary_urls_are_unavailable(): void
    {
        config(['clinic.asset_disk' => 'public']);

        Storage::disk('public')->put('clinic/doctors/public-avatar.jpg', 'photo');

        $url = app(ClinicAssetService::class)->temporaryAssetUrl(
            'clinic/doctors/public-avatar.jpg',
            now()->addMinutes(30),
        );

        $this->assertIsString($url);
        $this->assertStringContainsString('/clinic-assets/clinic/doctors/public-avatar.jpg?', $url);

        $path = parse_url($url, PHP_URL_PATH);
        $query = parse_url($url, PHP_URL_QUERY);

        $this->get($path.($query ? '?'.$query : ''))
            ->assertOk();
    }
}
