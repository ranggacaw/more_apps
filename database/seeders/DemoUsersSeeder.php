<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoUsersSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed demo users for each application role.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@moreclinic.test'],
            [
                'name' => 'MORE Admin',
                'phone' => '620000000001',
                'role' => 'admin',
                'email_verified_at' => now(),
                'password' => 'password',
            ],
        );

        $doctorUser = User::query()->updateOrCreate(
            ['email' => 'doctor@moreclinic.test'],
            [
                'name' => 'Dr. Maya Sari',
                'phone' => '620000000002',
                'role' => 'doctor',
                'email_verified_at' => now(),
                'password' => 'password',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'patient@moreclinic.test'],
            [
                'name' => 'Test Patient',
                'phone' => '620000000003',
                'role' => 'patient',
                'email_verified_at' => now(),
                'password' => 'password',
                'address' => 'Jakarta',
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'patient2@moreclinic.test'],
            [
                'name' => 'Demo Patient 2',
                'phone' => '620000000004',
                'role' => 'patient',
                'email_verified_at' => now(),
                'password' => 'password',
                'address' => 'Bandung',
            ],
        );

        Doctor::query()->updateOrCreate(
            ['user_id' => $doctorUser->id],
            [
                'specialization' => 'Aesthetic Medicine',
                'bio' => 'Focuses on skin health, wellness planning, and treatment consultations.',
                'consultation_fee' => 500000,
                'is_active' => true,
            ],
        );

        $this->command?->info('Demo users seeded: admin@moreclinic.test, doctor@moreclinic.test, patient@moreclinic.test');
        $this->command?->info('Password for all demo users: password');
    }
}
