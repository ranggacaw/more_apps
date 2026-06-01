<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['role' => 'patient', 'email_verified_at' => now()]),
            'doctor_id' => Doctor::factory(),
            'slot_id' => TimeSlot::factory(),
            'status' => 'confirmed',
            'booking_source' => 'self_service',
            'consultation_mode' => 'online',
        ];
    }
}
