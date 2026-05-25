<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\Package;
use App\Models\User;
use App\Models\UserPackage;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DoctorPackageTest extends TestCase
{
    use RefreshDatabase;

    private User $doctorUser;
    private Doctor $doctor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->doctorUser = User::factory()->create(['role' => 'doctor']);
        $this->doctor = Doctor::create([
            'user_id' => $this->doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);
    }

    public function test_doctor_can_list_packages(): void
    {
        $package = Package::create([
            'name' => 'Skin Glow Package',
            'slug' => 'skin-glow-package',
            'description' => 'A basic package',
            'price' => 1500000,
            'duration_days' => 30,
            'type' => 'basic',
            'consultation_credits' => 3,
            'is_active' => true,
        ]);

        $this->actingAs($this->doctorUser)
            ->get(route('doctor.packages.index'))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/Packages')
                ->has('packages', 1)
                ->where('packages.0.name', 'Skin Glow Package')
                ->where('packages.0.is_active', true)
            );
    }

    public function test_doctor_can_create_package(): void
    {
        $response = $this->actingAs($this->doctorUser)
            ->post(route('doctor.packages.store'), [
                'name' => 'Premium Anti-Aging',
                'description' => 'Advanced therapy package',
                'price' => 5000000,
                'duration_days' => 60,
                'type' => 'vip',
                'consultation_credits' => 10,
                'is_active' => true,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Package created.');

        $this->assertDatabaseHas('packages', [
            'name' => 'Premium Anti-Aging',
            'slug' => 'premium-anti-aging',
            'price' => 5000000,
            'type' => 'vip',
        ]);
    }

    public function test_doctor_can_update_package(): void
    {
        $package = Package::create([
            'name' => 'Skin Glow Package',
            'slug' => 'skin-glow-package',
            'description' => 'A basic package',
            'price' => 1500000,
            'duration_days' => 30,
            'type' => 'basic',
            'consultation_credits' => 3,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->doctorUser)
            ->patch(route('doctor.packages.update', $package), [
                'name' => 'Skin Glow Package Pro',
                'description' => 'Updated description',
                'price' => 2000000,
                'duration_days' => 45,
                'type' => 'advance',
                'consultation_credits' => 5,
                'is_active' => false,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Package updated.');

        $this->assertDatabaseHas('packages', [
            'id' => $package->id,
            'name' => 'Skin Glow Package Pro',
            'price' => 2000000,
            'is_active' => false,
        ]);
    }

    public function test_doctor_can_delete_unused_package(): void
    {
        $package = Package::create([
            'name' => 'Temporary Package',
            'slug' => 'temporary-package',
            'price' => 100000,
            'duration_days' => 14,
            'type' => 'basic',
            'consultation_credits' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->doctorUser)
            ->delete(route('doctor.packages.destroy', $package));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Package deleted successfully.');

        $this->assertDatabaseMissing('packages', [
            'id' => $package->id,
        ]);
    }

    public function test_doctor_cannot_delete_package_with_historical_user_packages(): void
    {
        $package = Package::create([
            'name' => 'Purchased Package',
            'slug' => 'purchased-package',
            'price' => 1500000,
            'duration_days' => 30,
            'type' => 'basic',
            'consultation_credits' => 3,
            'is_active' => true,
        ]);

        $patient = User::factory()->create(['role' => 'patient']);

        UserPackage::create([
            'user_id' => $patient->id,
            'package_id' => $package->id,
            'status' => 'active',
            'consultation_credits_total' => 3,
            'consultation_credits_remaining' => 3,
        ]);

        $response = $this->actingAs($this->doctorUser)
            ->delete(route('doctor.packages.destroy', $package));

        $response->assertRedirect();
        $response->assertSessionHas('error', 'This package has historical purchases or recommendations and cannot be deleted. Please deactivate it instead.');

        $this->assertDatabaseHas('packages', [
            'id' => $package->id,
        ]);
    }
}
