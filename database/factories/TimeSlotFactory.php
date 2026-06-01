<?php

namespace Database\Factories;

use App\Models\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimeSlotFactory extends Factory
{
    public function definition(): array
    {
        $start = now()->addDay()->setTime(16, 0);

        return [
            'doctor_id' => Doctor::factory(),
            'start_time' => $start,
            'end_time' => $start->copy()->addMinutes(30),
            'status' => 'available',
        ];
    }
}
