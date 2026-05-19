<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\DoctorAvailability;
use App\Models\Package;
use App\Models\User;
use App\Services\TimeSlotService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(DemoUsersSeeder::class);

        $doctorUser = User::query()->where('email', 'doctor@moreclinic.test')->firstOrFail();
        $doctor = Doctor::query()->where('user_id', $doctorUser->id)->firstOrFail();

        $availability = DoctorAvailability::query()->firstOrCreate(
            [
                'doctor_id' => $doctor->id,
                'day_of_week' => now()->addDay()->dayOfWeek,
                'start_time' => '09:00',
                'end_time' => '12:00',
            ],
            [
                'slot_duration_minutes' => 30,
                'is_active' => true,
            ],
        );

        Package::query()->firstOrCreate(
            ['slug' => 'glow-reset-program'],
            [
                'name' => 'Glow Reset Program',
                'description' => 'Three guided post-consultation visits with a personalized wellness plan.',
                'price' => 1200000,
                'consultation_credits' => 3,
                'is_active' => true,
            ],
        );

        app(TimeSlotService::class)->generateUpcomingSlots($availability, 7);
    }
}
