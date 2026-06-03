<?php

namespace Database\Seeders;

use App\Models\Package;
use Illuminate\Database\Seeder;

class SlimmingPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'slug' => 'slimming-basic-trial',
                'name' => 'Basic Trial',
                'description' => 'Basic Package – Trial 1x injection',
                'price' => 700000,
                'duration_days' => 1,
                'type' => 'basic',
                'consultation_credits' => 1,
                'is_active' => true,
            ],
            [
                'slug' => 'slimming-basic-4week',
                'name' => 'Basic 4-Week Package',
                'description' => 'Basic Package – 4-week program with weekly injections',
                'price' => 2500000,
                'duration_days' => 28,
                'type' => 'basic',
                'consultation_credits' => 4,
                'is_active' => true,
            ],
            [
                'slug' => 'slimming-advanced-trial',
                'name' => 'Advanced Trial',
                'description' => 'Advanced Package – Trial 1x injection',
                'price' => 1200000,
                'duration_days' => 1,
                'type' => 'advance',
                'consultation_credits' => 1,
                'is_active' => true,
            ],
            [
                'slug' => 'slimming-advanced-4x',
                'name' => 'Advanced 4x Injections Package',
                'description' => 'Advanced Package – 4x injections over 4 weeks',
                'price' => 4500000,
                'duration_days' => 28,
                'type' => 'advance',
                'consultation_credits' => 4,
                'is_active' => true,
            ],
            [
                'slug' => 'slimming-diamond-trial',
                'name' => 'Diamond Trial',
                'description' => 'Diamond Package – Trial 1x injection',
                'price' => 2000000,
                'duration_days' => 1,
                'type' => 'vip',
                'consultation_credits' => 1,
                'is_active' => true,
            ],
            [
                'slug' => 'slimming-diamond-3x',
                'name' => 'Diamond 3x Injections Package',
                'description' => 'Diamond Package – 3x injections, once every 10 days',
                'price' => 5500000,
                'duration_days' => 30,
                'type' => 'vip',
                'consultation_credits' => 3,
                'is_active' => true,
            ],
            [
                'slug' => 'slimming-diamond-oral-medication',
                'name' => 'Diamond Additional Oral Medication',
                'description' => 'Diamond Package – Additional oral medication for 10 days (requires Diamond primary option)',
                'price' => 500000,
                'duration_days' => 10,
                'type' => 'vip',
                'consultation_credits' => 0,
                'is_active' => true,
            ],
        ];

        foreach ($packages as $package) {
            Package::query()->updateOrCreate(
                ['slug' => $package['slug']],
                $package,
            );
        }
    }
}
