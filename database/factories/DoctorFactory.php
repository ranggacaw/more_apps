<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DoctorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'doctor', 'email_verified_at' => now()]),
            'specialization' => 'Aesthetic Doctor',
            'bio' => fake()->sentence(),
            'consultation_fee' => 500000,
            'is_active' => true,
        ];
    }
}
