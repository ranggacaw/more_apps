<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ScheduleOverrideLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'admin_user_id' => User::factory(),
            'doctor_id' => Doctor::factory(),
            'override_date' => now()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'reason' => 'Patient needs an approved outside-hours appointment.',
        ];
    }
}
