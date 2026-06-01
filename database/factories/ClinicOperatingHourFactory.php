<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ClinicOperatingHourFactory extends Factory
{
    public function definition(): array
    {
        return [
            'day_of_week' => fake()->numberBetween(0, 6),
            'start_time' => '16:00:00',
            'end_time' => '20:00:00',
            'is_active' => true,
        ];
    }
}
