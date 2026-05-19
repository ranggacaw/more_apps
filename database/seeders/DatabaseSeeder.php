<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\DoctorAvailability;
use App\Models\User;
use App\Services\TimeSlotService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'MORE Admin',
            'email' => 'admin@moreclinic.test',
            'phone' => '620000000001',
            'role' => 'admin',
            'password' => Hash::make('password'),
        ]);

        $doctorUser = User::factory()->create([
            'name' => 'Dr. Maya Sari',
            'email' => 'doctor@moreclinic.test',
            'phone' => '620000000002',
            'role' => 'doctor',
            'password' => Hash::make('password'),
        ]);

        $patient = User::factory()->create([
            'name' => 'Test Patient',
            'email' => 'patient@moreclinic.test',
            'phone' => '620000000003',
            'role' => 'patient',
            'password' => Hash::make('password'),
        ]);

        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'bio' => 'Focuses on skin health, wellness planning, and treatment consultations.',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        $availability = DoctorAvailability::create([
            'doctor_id' => $doctor->id,
            'day_of_week' => now()->addDay()->dayOfWeek,
            'start_time' => '09:00',
            'end_time' => '12:00',
            'slot_duration_minutes' => 30,
            'is_active' => true,
        ]);

        app(TimeSlotService::class)->generateUpcomingSlots($availability, 7);
    }
}
