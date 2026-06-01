<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoUsersSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->upsertUser([
            'email' => 'admin@moreclinic.test',
            'name' => 'MORE Admin',
            'phone' => '620000000001',
            'role' => 'admin',
            'email_verified_at' => now(),
            'password' => 'password',
        ]);

        $this->upsertUser([
            'email' => 'finance@moreclinic.test',
            'name' => 'MORE Finance Super Admin',
            'phone' => '620000000004',
            'role' => 'super_admin',
            'email_verified_at' => now(),
            'password' => 'password',
        ]);

        foreach ([
            [
                'email' => 'ida.risma@moreclinic.test',
                'name' => 'dr. Ida Ayu Risma',
                'phone' => '620000000002',
                'specialization' => 'Aesthetic Medicine',
                'bio' => 'Focuses on skin health, metabolic wellness planning, and guided treatment consultations.',
            ],
            [
                'email' => 'rara.yunita@moreclinic.test',
                'name' => 'dr. Rara Yunita',
                'phone' => '620000000003',
                'specialization' => 'Clinical Nutrition',
                'bio' => 'Supports structured body recomposition programs with practical weekly follow-up.',
            ],
        ] as $doctor) {
            $doctorUser = $this->upsertUser([
                'email' => $doctor['email'],
                'name' => $doctor['name'],
                'phone' => $doctor['phone'],
                'role' => 'doctor',
                'email_verified_at' => now(),
                'password' => 'password',
            ]);

            Doctor::query()->updateOrCreate(
                ['user_id' => $doctorUser->id],
                [
                    'specialization' => $doctor['specialization'],
                    'bio' => $doctor['bio'],
                    'consultation_fee' => 500000,
                    'is_active' => true,
                ],
            );
        }

        $this->command?->info('Demo users seeded: 1 admin + 1 finance super admin + 2 doctors.');
        $this->command?->info('Password for all demo users: password');
    }

    private function upsertUser(array $attributes): User
    {
        $user = User::query()
            ->where('email', $attributes['email'])
            ->orWhere('phone', $attributes['phone'])
            ->first() ?? new User();

        $user->fill($attributes);
        $user->save();

        return $user;
    }
}
