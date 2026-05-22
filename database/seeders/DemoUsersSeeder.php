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
        $this->upsertUser(
            [
                'email' => 'admin@moreclinic.test',
                'name' => 'MORE Admin',
                'phone' => '620000000001',
                'role' => 'admin',
                'email_verified_at' => now(),
                'password' => 'password',
            ],
        );

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
            $doctorUser = $this->upsertUser(
                [
                    'email' => $doctor['email'],
                    'name' => $doctor['name'],
                    'phone' => $doctor['phone'],
                    'role' => 'doctor',
                    'email_verified_at' => now(),
                    'password' => 'password',
                ],
            );

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

        foreach ([
            [
                'email' => 'sinta.putri@moreclinic.test',
                'name' => 'Sinta Putri',
                'phone' => '620000000101',
                'address' => 'Jakarta',
            ],
            [
                'email' => 'nabila.maharani@moreclinic.test',
                'name' => 'Nabila Maharani',
                'phone' => '620000000102',
                'address' => 'Bandung',
            ],
            [
                'email' => 'ayu.lestari@moreclinic.test',
                'name' => 'Ayu Lestari',
                'phone' => '620000000103',
                'address' => 'Surabaya',
            ],
            [
                'email' => 'dimas.pratama@moreclinic.test',
                'name' => 'Dimas Pratama',
                'phone' => '620000000104',
                'address' => 'Yogyakarta',
            ],
            [
                'email' => 'citra.wulandari@moreclinic.test',
                'name' => 'Citra Wulandari',
                'phone' => '620000000105',
                'address' => 'Denpasar',
            ],
        ] as $patient) {
            $this->upsertUser(
                [
                    'email' => $patient['email'],
                    'name' => $patient['name'],
                    'phone' => $patient['phone'],
                    'role' => 'patient',
                    'email_verified_at' => now(),
                    'password' => 'password',
                    'address' => $patient['address'],
                ],
            );
        }

        $this->command?->info('Demo users seeded: admin plus 2 doctors and 5 patients.');
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
