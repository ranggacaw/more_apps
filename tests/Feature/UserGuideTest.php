<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserGuideTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_users_of_each_role_can_open_the_user_guide(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);
        $admin = User::factory()->create(['role' => 'admin']);
        $doctorUser = User::factory()->create(['role' => 'doctor', 'name' => 'Dr. Guide']);

        Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        $this->actingAs($patient)
            ->get(route('user-guide'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('UserGuide')
                ->where('role', 'patient')
                ->where('title', 'Cara Menggunakan Aplikasi MORE Clinic')
                ->where('blocks.0.type', 'paragraph'));

        $this->actingAs($doctorUser)
            ->get(route('user-guide'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('UserGuide')
                ->where('role', 'doctor')
                ->where('doctor.name', 'Dr. Guide')
                ->where('doctor.specialization', 'Aesthetic Medicine'));

        $this->actingAs($admin)
            ->get(route('user-guide'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('UserGuide')
                ->where('role', 'admin')
                ->where('title', 'Cara Menggunakan Aplikasi MORE Clinic'));
    }

    public function test_user_guide_requires_verified_authentication(): void
    {
        $unverifiedPatient = User::factory()->unverified()->create(['role' => 'patient']);

        $this->get(route('user-guide'))
            ->assertRedirect(route('login'));

        $this->actingAs($unverifiedPatient)
            ->get(route('user-guide'))
            ->assertRedirect(route('verification.notice'));
    }
}
