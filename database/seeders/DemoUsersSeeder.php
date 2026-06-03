<?php

namespace Database\Seeders;

use App\Models\BalanceSheetEntry;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\OperatingExpense;
use App\Models\Package;
use App\Models\Payment;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\UserPackage;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoUsersSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $admin = $this->upsertUser([
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
                'specialization' => 'Aesthetic Medicine',
                'bio' => 'Focuses on skin health, metabolic wellness planning, and guided treatment consultations.',
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

        $this->seedReportPatients($admin);
        $this->seedFinancialReportFixtures();

        $this->command?->info('Demo users seeded: 1 admin + 1 finance super admin + 2 doctors + 3 report patients.');
        $this->command?->info('Password for all demo users: password');
    }

    private function seedReportPatients(User $admin): void
    {
        $package = Package::query()->updateOrCreate(
            ['slug' => 'demo-report-slimming-4-week'],
            [
                'name' => 'Demo Report Slimming 4-Week',
                'description' => 'Seeded package used to populate admin and finance reports with patient purchase data.',
                'price' => 2500000,
                'duration_days' => 28,
                'type' => 'basic',
                'consultation_credits' => 4,
                'is_active' => true,
            ],
        );

        foreach ($this->reportPatients() as $patient) {
            $doctor = Doctor::query()
                ->whereHas('user', fn ($query) => $query->where('email', $patient['doctor_email']))
                ->firstOrFail();

            $this->seedReportPatient($patient, $admin, $doctor, $package);
        }
    }

    private function seedReportPatient(array $patient, User $admin, Doctor $doctor, Package $package): void
    {
        $paidAt = now()->subDays($patient['days_ago'])->setTime($patient['hour'], 0);
        $registeredAt = $paidAt->copy()->subDays(2);
        $slotStart = $paidAt->copy()->subHour();

        $patientUser = $this->upsertUser([
            'email' => $patient['email'],
            'name' => $patient['name'],
            'phone' => $patient['phone'],
            'role' => null,
            'email_verified_at' => null,
            'password' => 'password',
            'date_of_birth' => $patient['date_of_birth'],
            'address' => $patient['address'],
            'medical_notes' => $patient['medical_notes'],
        ]);
        $patientUser->forceFill([
            'created_at' => $registeredAt,
            'updated_at' => now(),
        ])->save();

        $slot = TimeSlot::query()->updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'start_time' => $slotStart,
            ],
            [
                'availability_id' => null,
                'end_time' => $slotStart->copy()->addMinutes(30),
                'status' => 'booked',
                'locked_until' => null,
                'locked_by_user_id' => null,
            ],
        );

        $booking = Booking::query()->updateOrCreate(
            ['meeting_link' => sprintf('https://meet.moreclinic.test/demo-report-%s', $patient['key'])],
            [
                'user_id' => $patientUser->id,
                'booked_by_admin_id' => $admin->id,
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'status' => 'completed',
                'booking_source' => 'admin_assisted',
                'consultation_mode' => 'online',
                'guest_patient_name' => null,
                'guest_whatsapp' => null,
                'notes' => $patient['booking_notes'],
                'meeting_link_requested_at' => $registeredAt,
                'meeting_link_submitted_at' => $registeredAt->copy()->addHour(),
            ],
        );
        $booking->forceFill([
            'created_at' => $registeredAt,
            'updated_at' => now(),
        ])->save();

        $consultationPayment = Payment::query()->updateOrCreate(
            ['midtrans_order_id' => sprintf('demo-report-consultation-%s', $patient['key'])],
            [
                'user_id' => $patientUser->id,
                'booking_id' => $booking->id,
                'consultation_id' => null,
                'package_id' => null,
                'attempt_number' => 1,
                'type' => 'consultation',
                'amount' => 500000,
                'return_amount' => 0,
                'hpp_amount' => 0,
                'consultation_credit_applied' => 0,
                'consultation_credit_source_payment_id' => null,
                'provider' => 'midtrans',
                'snap_token' => null,
                'status' => 'paid',
                'paid_at' => $paidAt,
                'payload' => ['seeded' => true, 'scenario' => 'demo_report_consultation'],
            ],
        );

        $userPackage = null;
        $packagePayment = null;

        if ($patient['package']) {
            $packagePaidAt = $paidAt->copy()->addDay();
            $packagePayment = Payment::query()->updateOrCreate(
                ['midtrans_order_id' => sprintf('demo-report-package-%s', $patient['key'])],
                [
                    'user_id' => $patientUser->id,
                    'booking_id' => null,
                    'consultation_id' => null,
                    'package_id' => $package->id,
                    'attempt_number' => 1,
                    'type' => 'package',
                    'amount' => $package->price - 500000,
                    'return_amount' => $patient['return_amount'],
                    'hpp_amount' => $patient['hpp_amount'],
                    'consultation_credit_applied' => 500000,
                    'consultation_credit_source_payment_id' => $consultationPayment->id,
                    'provider' => 'midtrans',
                    'snap_token' => null,
                    'status' => 'paid',
                    'paid_at' => $packagePaidAt,
                    'payload' => ['seeded' => true, 'scenario' => 'demo_report_package'],
                ],
            );

            $userPackage = UserPackage::query()->updateOrCreate(
                [
                    'user_id' => $patientUser->id,
                    'payment_id' => $packagePayment->id,
                ],
                [
                    'package_id' => $package->id,
                    'status' => 'active',
                    'consultation_credits_total' => $package->consultation_credits,
                    'consultation_credits_remaining' => $patient['remaining_credits'],
                    'activated_at' => $packagePaidAt,
                    'expires_at' => $packagePaidAt->copy()->addDays($package->duration_days),
                    'metadata' => ['seeded' => true, 'scenario' => 'demo_report_patient'],
                ],
            );
            $userPackage->forceFill([
                'created_at' => $packagePaidAt,
                'updated_at' => now(),
            ])->save();
        }

        $consultation = Consultation::query()->updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'queue_entry_id' => null,
                'user_id' => $patientUser->id,
                'doctor_id' => $doctor->id,
                'recommended_package_id' => $package->id,
                'user_package_id' => $userPackage?->id,
                'notes' => $patient['consultation_notes'],
                'slimming_weight_kg' => $patient['weight_kg'],
                'slimming_bmi' => $patient['bmi'],
                'slimming_vfa' => $patient['vfa'],
                'slimming_body_fat_percentage' => $patient['body_fat'],
                'slimming_body_age' => $patient['body_age'],
                'slimming_muscle_mass' => $patient['muscle_mass'],
                'slimming_upper_arm_cm' => $patient['upper_arm_cm'],
                'slimming_waist_cm' => $patient['waist_cm'],
                'slimming_abdomen_cm' => $patient['abdomen_cm'],
                'slimming_hip_cm' => $patient['hip_cm'],
                'slimming_thigh_cm' => $patient['thigh_cm'],
                'slimming_calf_cm' => $patient['calf_cm'],
                'slimming_metabolism_bmr' => $patient['bmr'],
                'slimming_anti_oxidant' => $patient['anti_oxidant'],
                'meal_plan_pdf_path' => null,
                'completed_at' => $paidAt->copy()->addMinutes(45),
            ],
        );

        $consultationPayment->update(['consultation_id' => $consultation->id]);

        if ($patient['pending_treatment_amount'] > 0) {
            Payment::query()->updateOrCreate(
                ['midtrans_order_id' => sprintf('demo-report-treatment-%s', $patient['key'])],
                [
                    'user_id' => $patientUser->id,
                    'booking_id' => $booking->id,
                    'consultation_id' => $consultation->id,
                    'package_id' => null,
                    'attempt_number' => 2,
                    'type' => 'consultation_treatment',
                    'amount' => $patient['pending_treatment_amount'],
                    'return_amount' => 0,
                    'hpp_amount' => $patient['pending_treatment_hpp'],
                    'consultation_credit_applied' => 0,
                    'consultation_credit_source_payment_id' => null,
                    'provider' => 'internal',
                    'snap_token' => null,
                    'status' => 'pending',
                    'paid_at' => null,
                    'payload' => [
                        'seeded' => true,
                        'scenario' => 'demo_report_pending_treatment',
                        'line_items' => $patient['treatment_items'],
                    ],
                ],
            );
        }

        $patientUser->update([
            'consultation_credit' => 500000,
            'consultation_credit_awarded_at' => $paidAt,
            'consultation_credit_expires_at' => $paidAt->copy()->addDays((int) config('clinic.consultation_credit_expires_days', 30)),
            'consultation_credit_consumed_at' => $packagePayment ? $packagePayment->paid_at : null,
            'consultation_credit_payment_id' => $consultationPayment->id,
        ]);

        if ($userPackage) {
            foreach ($patient['check_ins'] as $checkIn) {
                CheckIn::query()->updateOrCreate(
                    [
                        'user_package_id' => $userPackage->id,
                        'program_week' => $checkIn['program_week'],
                    ],
                    [
                        'booking_id' => null,
                        'consultation_id' => $consultation->id,
                        'user_id' => $patientUser->id,
                        'doctor_id' => $doctor->id,
                        'weight_kg' => $checkIn['weight_kg'],
                        'waist_cm' => $checkIn['waist_cm'],
                        'notes' => $checkIn['notes'],
                        'supporting_document_path' => null,
                        'progress_photo_path' => null,
                        'review_notes' => $checkIn['review_notes'],
                        'remaining_consultations_after' => $patient['remaining_credits'],
                        'checked_in_at' => $paidAt->copy()->addWeeks($checkIn['program_week'])->subDay(),
                        'reviewed_at' => $checkIn['review_notes'] ? $paidAt->copy()->addWeeks($checkIn['program_week']) : null,
                    ],
                );
            }
        }
    }

    private function seedFinancialReportFixtures(): void
    {
        OperatingExpense::query()->updateOrCreate(
            ['name' => 'Demo report clinic supplies'],
            [
                'category' => 'supplies',
                'amount' => 425000,
                'expense_date' => now()->subDays(7)->toDateString(),
                'notes' => 'Seeded expense for finance profit and loss demo data.',
            ],
        );

        OperatingExpense::query()->updateOrCreate(
            ['name' => 'Demo report staff transport'],
            [
                'category' => 'operations',
                'amount' => 300000,
                'expense_date' => now()->subDays(3)->toDateString(),
                'notes' => 'Seeded expense for finance profit and loss demo data.',
            ],
        );

        BalanceSheetEntry::query()->updateOrCreate(
            ['label' => 'Demo report treatment equipment'],
            [
                'side' => 'asset',
                'category' => 'equipment',
                'amount' => 15000000,
                'entry_date' => now()->subDays(20)->toDateString(),
                'notes' => 'Seeded manual asset row for finance balance-sheet demo data.',
            ],
        );

        BalanceSheetEntry::query()->updateOrCreate(
            ['label' => 'Demo report owner capital'],
            [
                'side' => 'equity',
                'category' => 'capital',
                'amount' => 15000000,
                'entry_date' => now()->subDays(20)->toDateString(),
                'notes' => 'Seeded manual equity row for finance balance-sheet demo data.',
            ],
        );
    }

    private function reportPatients(): array
    {
        return [
            [
                'key' => 'ayu-kartika',
                'email' => 'ayu.kartika@moreclinic.test',
                'name' => 'Ayu Kartika',
                'phone' => '620000000101',
                'date_of_birth' => '1992-04-14',
                'address' => 'Jl. Danau Tamblingan No. 24, Denpasar',
                'medical_notes' => 'Postpartum weight management, no known drug allergies.',
                'doctor_email' => 'ida.risma@moreclinic.test',
                'days_ago' => 11,
                'hour' => 10,
                'package' => true,
                'remaining_credits' => 3,
                'return_amount' => 0,
                'hpp_amount' => 875000,
                'pending_treatment_amount' => 650000,
                'pending_treatment_hpp' => 210000,
                'booking_notes' => 'Wants a structured slimming program before a family event.',
                'consultation_notes' => 'Started a 4-week slimming program with nutrition guidance and weekly monitoring.',
                'weight_kg' => 74.5,
                'bmi' => 28.4,
                'vfa' => 12,
                'body_fat' => 34.2,
                'body_age' => 41,
                'muscle_mass' => 43.8,
                'upper_arm_cm' => 31.2,
                'waist_cm' => 88.5,
                'abdomen_cm' => 94.1,
                'hip_cm' => 103.4,
                'thigh_cm' => 59.6,
                'calf_cm' => 37.2,
                'bmr' => 1390,
                'anti_oxidant' => 42,
                'treatment_items' => [
                    ['name' => 'Slimming injection booster', 'quantity' => 1, 'unit_price' => 650000, 'hpp_amount' => 210000],
                ],
                'check_ins' => [
                    ['program_week' => 1, 'weight_kg' => 73.6, 'waist_cm' => 87.4, 'notes' => 'Good appetite control, mild fatigue on day two.', 'review_notes' => 'Continue hydration and keep meal timing consistent.'],
                ],
            ],
            [
                'key' => 'dini-prameswari',
                'email' => 'dini.prameswari@moreclinic.test',
                'name' => 'Dini Prameswari',
                'phone' => '620000000102',
                'date_of_birth' => '1988-09-03',
                'address' => 'Jl. Sunset Road No. 88, Kuta',
                'medical_notes' => 'Mild gastritis history; prefers gradual appetite-control plan.',
                'doctor_email' => 'rara.yunita@moreclinic.test',
                'days_ago' => 17,
                'hour' => 14,
                'package' => true,
                'remaining_credits' => 2,
                'return_amount' => 100000,
                'hpp_amount' => 875000,
                'pending_treatment_amount' => 0,
                'pending_treatment_hpp' => 0,
                'booking_notes' => 'Requested doctor-supervised body composition tracking.',
                'consultation_notes' => 'Recommended 4-week slimming program, lower-caffeine nutrition plan, and weekly waist tracking.',
                'weight_kg' => 68.2,
                'bmi' => 26.1,
                'vfa' => 10,
                'body_fat' => 31.6,
                'body_age' => 38,
                'muscle_mass' => 41.9,
                'upper_arm_cm' => 29.8,
                'waist_cm' => 82.3,
                'abdomen_cm' => 89.5,
                'hip_cm' => 98.1,
                'thigh_cm' => 56.7,
                'calf_cm' => 35.4,
                'bmr' => 1320,
                'anti_oxidant' => 45,
                'treatment_items' => [],
                'check_ins' => [
                    ['program_week' => 1, 'weight_kg' => 67.5, 'waist_cm' => 81.7, 'notes' => 'Reduced late-night snacking and completed three walks.', 'review_notes' => 'Progress is on track; increase protein at breakfast.'],
                    ['program_week' => 2, 'weight_kg' => 66.9, 'waist_cm' => 80.8, 'notes' => 'Energy is better, appetite stable.', 'review_notes' => null],
                ],
            ],
            [
                'key' => 'nabila-saraswati',
                'email' => 'nabila.saraswati@moreclinic.test',
                'name' => 'Nabila Saraswati',
                'phone' => '620000000103',
                'date_of_birth' => '1996-12-22',
                'address' => 'Jl. Tukad Yeh Aya No. 17, Denpasar',
                'medical_notes' => 'Initial consultation only; considering package purchase next visit.',
                'doctor_email' => 'ida.risma@moreclinic.test',
                'days_ago' => 2,
                'hour' => 16,
                'package' => false,
                'remaining_credits' => 0,
                'return_amount' => 0,
                'hpp_amount' => 0,
                'pending_treatment_amount' => 350000,
                'pending_treatment_hpp' => 120000,
                'booking_notes' => 'Needs assessment before choosing an aesthetic or slimming plan.',
                'consultation_notes' => 'Completed initial measurements and provided package recommendation for follow-up decision.',
                'weight_kg' => 61.4,
                'bmi' => 23.7,
                'vfa' => 7,
                'body_fat' => 27.4,
                'body_age' => 31,
                'muscle_mass' => 38.5,
                'upper_arm_cm' => 27.1,
                'waist_cm' => 74.8,
                'abdomen_cm' => 80.2,
                'hip_cm' => 94.6,
                'thigh_cm' => 53.4,
                'calf_cm' => 34.1,
                'bmr' => 1245,
                'anti_oxidant' => 48,
                'treatment_items' => [
                    ['name' => 'Doctor-selected treatment add-on', 'quantity' => 1, 'unit_price' => 350000, 'hpp_amount' => 120000],
                ],
                'check_ins' => [],
            ],
        ];
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
