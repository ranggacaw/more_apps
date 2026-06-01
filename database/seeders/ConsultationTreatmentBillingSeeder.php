<?php

namespace Database\Seeders;

use App\Models\ClinicOperatingHour;
use App\Models\ConsultationPackageOption;
use Illuminate\Database\Seeder;

class ConsultationTreatmentBillingSeeder extends Seeder
{
    public function run(): void
    {
        foreach (range(1, 5) as $dayOfWeek) {
            ClinicOperatingHour::updateOrCreate(
                ['day_of_week' => $dayOfWeek, 'start_time' => '16:00:00', 'end_time' => '20:00:00'],
                ['is_active' => true],
            );
        }

        foreach ([0, 6] as $dayOfWeek) {
            ClinicOperatingHour::updateOrCreate(
                ['day_of_week' => $dayOfWeek, 'start_time' => '10:00:00', 'end_time' => '20:00:00'],
                ['is_active' => true],
            );
        }

        $options = [
            ['basic', 'primary', 'Basic Trial', 700000, '1 injection', 'Trial', null, null, 10],
            ['basic', 'primary', 'Basic 4-week Package', 2500000, 'Weekly injection', '4 weeks', 28, null, 20],
            ['advanced', 'primary', 'Advanced Trial', 1200000, '1 injection', 'Trial', null, null, 30],
            ['advanced', 'primary', 'Advanced 4x Injections Package', 4500000, '4 injections', '4 sessions', null, null, 40],
            ['diamond', 'primary', 'Diamond Trial', 2000000, '1 injection', 'Trial', null, null, 50],
            ['diamond', 'primary', 'Diamond 3x Injections Package', 5500000, '3 injections', '3 sessions', null, null, 60],
            ['diamond', 'addon', 'Diamond Additional Oral Medication', 500000, null, '10 days', 10, 'diamond', 70],
        ];

        foreach ($options as [$family, $type, $name, $price, $frequency, $duration, $days, $requiresFamily, $sortOrder]) {
            ConsultationPackageOption::updateOrCreate(
                ['name' => $name],
                [
                    'program_family' => $family,
                    'option_type' => $type,
                    'price' => $price,
                    'injection_frequency' => $frequency,
                    'duration_label' => $duration,
                    'duration_days' => $days,
                    'requires_program_family' => $requiresFamily,
                    'sort_order' => $sortOrder,
                    'is_active' => true,
                ],
            );
        }
    }
}
