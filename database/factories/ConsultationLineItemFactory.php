<?php

namespace Database\Factories;

use App\Models\Consultation;
use App\Models\Doctor;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationLineItemFactory extends Factory
{
    public function definition(): array
    {
        $unitPrice = fake()->numberBetween(100000, 1000000);

        return [
            'consultation_id' => Consultation::factory(),
            'doctor_id' => Doctor::factory(),
            'type' => 'manual_treatment',
            'name' => fake()->words(2, true),
            'quantity' => 1,
            'dosage_value' => 1,
            'dosage_unit' => 'ml',
            'unit_price' => $unitPrice,
            'hpp_amount' => 0,
            'line_total' => $unitPrice,
            'metadata' => [],
        ];
    }
}
