<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'user_id' => User::factory()->state(['role' => null, 'email_verified_at' => now()]),
            'doctor_id' => Doctor::factory(),
            'notes' => fake()->paragraph(),
            'completed_at' => now(),
        ];
    }
}
