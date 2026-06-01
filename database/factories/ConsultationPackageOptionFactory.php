<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationPackageOptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'program_family' => fake()->randomElement(['basic', 'advanced', 'diamond']),
            'option_type' => 'primary',
            'name' => fake()->unique()->words(3, true),
            'price' => fake()->numberBetween(500000, 6000000),
            'injection_frequency' => 'Weekly injection',
            'duration_label' => '4 weeks',
            'duration_days' => 28,
            'requires_program_family' => null,
            'sort_order' => fake()->numberBetween(1, 100),
            'is_active' => true,
        ];
    }
}
