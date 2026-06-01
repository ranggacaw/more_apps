<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class AestheticProgramFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(3, true),
            'price' => fake()->numberBetween(250000, 2500000),
            'hpp_amount' => fake()->numberBetween(50000, 1000000),
            'is_active' => true,
        ];
    }
}
