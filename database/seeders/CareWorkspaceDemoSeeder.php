<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\DoctorAvailability;
use App\Models\Package;
use App\Models\Payment;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\UserPackage;
use App\Services\TimeSlotService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CareWorkspaceDemoSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $package = Package::query()->updateOrCreate(
            ['slug' => 'glow-reset-program'],
            [
                'name' => 'Glow Reset Program',
                'description' => 'Three guided post-consultation visits with a personalized wellness plan.',
                'price' => 1200000,
                'duration_days' => 30,
                'type' => 'basic',
                'consultation_credits' => 3,
                'is_active' => true,
            ],
        );

        foreach ([
            [
                'email' => 'doctor.test@moreclinic.test',
                'name' => 'doctor test',
                'phone' => '620000000004',
                'specialization' => 'General Wellness',
                'bio' => 'Handles foundational consultations, active-program follow-up, and practical habit coaching.',
                'day_of_week' => 1,
                'start_time' => '08:00',
                'end_time' => '11:00',
            ],
            [
                'email' => 'rara.yunita@moreclinic.test',
                'name' => 'dr. Rara Yunita',
                'phone' => '620000000003',
                'specialization' => 'Clinical Nutrition',
                'bio' => 'Supports structured body recomposition programs with practical weekly follow-up.',
                'day_of_week' => 3,
                'start_time' => '13:00',
                'end_time' => '16:00',
            ],
            [
                'email' => 'ida.risma@moreclinic.test',
                'name' => 'dr. Ida Ayu Risma',
                'phone' => '620000000002',
                'specialization' => 'Aesthetic Medicine',
                'bio' => 'Focuses on skin health, metabolic wellness planning, and guided treatment consultations.',
                'day_of_week' => 5,
                'start_time' => '09:00',
                'end_time' => '12:00',
            ],
        ] as $doctor) {
            $doctorProfile = $this->seedDoctor($doctor);
            $availability = $this->seedDoctorAvailability(
                $doctorProfile,
                $doctor['day_of_week'],
                $doctor['start_time'],
                $doctor['end_time'],
            );

            app(TimeSlotService::class)->generateUpcomingSlots($availability, 21);
        }

        foreach ($this->patients() as $patient) {
            $this->seedProgramPatient($patient, $package);
        }

        $this->command?->info('Care workspace demo seeded: 3 doctors and 10 patients with programs and medical records.');
        $this->command?->info('Password for all care workspace demo users: password');
    }

    private function seedDoctor(array $doctor): Doctor
    {
        $user = $this->upsertUser([
            'email' => $doctor['email'],
            'name' => $doctor['name'],
            'phone' => $doctor['phone'],
            'role' => 'doctor',
            'email_verified_at' => now(),
            'password' => 'password',
        ]);

        return Doctor::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'specialization' => $doctor['specialization'],
                'bio' => $doctor['bio'],
                'consultation_fee' => 500000,
                'is_active' => true,
            ],
        );
    }

    private function seedDoctorAvailability(Doctor $doctor, int $dayOfWeek, string $startTime, string $endTime): DoctorAvailability
    {
        return DoctorAvailability::query()->updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'day_of_week' => $dayOfWeek,
                'start_time' => $startTime,
                'end_time' => $endTime,
            ],
            [
                'slot_duration_minutes' => 30,
                'is_active' => true,
            ],
        );
    }

    private function seedProgramPatient(array $patient, Package $package): void
    {
        $patientUser = $this->upsertUser([
            'email' => $patient['email'],
            'name' => $patient['name'],
            'phone' => $patient['phone'],
            'role' => 'patient',
            'email_verified_at' => now(),
            'password' => 'password',
            'date_of_birth' => $patient['date_of_birth'],
            'address' => $patient['address'],
            'medical_notes' => $patient['medical_notes'],
        ]);

        $doctor = Doctor::query()
            ->whereHas('user', fn ($query) => $query->where('email', $patient['doctor_email']))
            ->firstOrFail();

        $startedAt = now()
            ->subDays($patient['started_days_ago'])
            ->setTime($patient['hour'], 0);

        $slot = TimeSlot::query()->updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'start_time' => $startedAt->copy(),
            ],
            [
                'end_time' => $startedAt->copy()->addMinutes(30),
                'status' => 'booked',
                'availability_id' => null,
                'locked_until' => null,
                'locked_by_user_id' => null,
            ],
        );

        $meetingLink = sprintf('https://meet.moreclinic.test/%s-program', str($patient['email'])->before('@'));

        $booking = Booking::query()->updateOrCreate(
            ['meeting_link' => $meetingLink],
            [
                'user_id' => $patientUser->id,
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'status' => 'completed',
                'notes' => $patient['booking_notes'],
                'meeting_link' => $meetingLink,
            ],
        );

        $consultationPayment = Payment::query()->updateOrCreate(
            ['midtrans_order_id' => sprintf('seed-consultation-%s', str($patient['email'])->before('@'))],
            [
                'user_id' => $patientUser->id,
                'booking_id' => $booking->id,
                'package_id' => null,
                'attempt_number' => 1,
                'type' => 'consultation',
                'amount' => 500000,
                'consultation_credit_applied' => 0,
                'consultation_credit_source_payment_id' => null,
                'provider' => 'midtrans',
                'snap_token' => null,
                'status' => 'paid',
                'paid_at' => $startedAt->copy(),
                'payload' => ['seeded' => true, 'scenario' => 'care_workspace_consultation'],
            ],
        );

        $packagePayment = Payment::query()->updateOrCreate(
            ['midtrans_order_id' => sprintf('seed-package-%s', str($patient['email'])->before('@'))],
            [
                'user_id' => $patientUser->id,
                'booking_id' => null,
                'package_id' => $package->id,
                'attempt_number' => 1,
                'type' => 'package',
                'amount' => max($package->price - 500000, 0),
                'consultation_credit_applied' => min(500000, $package->price),
                'consultation_credit_source_payment_id' => $consultationPayment->id,
                'provider' => 'midtrans',
                'snap_token' => null,
                'status' => 'paid',
                'paid_at' => $startedAt->copy()->addDay(),
                'payload' => ['seeded' => true, 'scenario' => 'care_workspace_program'],
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
                'activated_at' => $startedAt->copy()->addDay(),
                'expires_at' => $startedAt->copy()->addDays($package->duration_days),
                'metadata' => ['seeded' => true, 'program' => 'care_workspace_demo'],
            ],
        );

        $consultation = Consultation::query()->updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'user_id' => $patientUser->id,
                'doctor_id' => $doctor->id,
                'recommended_package_id' => $package->id,
                'user_package_id' => $userPackage->id,
                'notes' => $patient['consultation_notes'],
                'meal_plan_pdf_path' => null,
                'completed_at' => $startedAt->copy()->addHour(),
            ],
        );

        $patientUser->update([
            'consultation_credit' => 500000,
            'consultation_credit_awarded_at' => $startedAt->copy(),
            'consultation_credit_expires_at' => $startedAt->copy()->addDays((int) config('clinic.consultation_credit_expires_days', 30)),
            'consultation_credit_consumed_at' => $startedAt->copy()->addDay(),
            'consultation_credit_payment_id' => $consultationPayment->id,
        ]);

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
                    'progress_photo_path' => null,
                    'review_notes' => $checkIn['review_notes'],
                    'remaining_consultations_after' => $patient['remaining_credits'],
                    'checked_in_at' => $startedAt->copy()->addWeeks($checkIn['program_week'])->subDay(),
                    'reviewed_at' => $checkIn['review_notes'] ? $startedAt->copy()->addWeeks($checkIn['program_week']) : null,
                ],
            );
        }
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

    private function patients(): array
    {
        return [
            [
                'email' => 'sinta.putri@moreclinic.test',
                'name' => 'Sinta Putri',
                'phone' => '620000000101',
                'date_of_birth' => '1993-02-14',
                'address' => 'Jakarta',
                'medical_notes' => 'Monitoring body composition change and post-acne skin recovery.',
                'doctor_email' => 'ida.risma@moreclinic.test',
                'started_days_ago' => 28,
                'hour' => 9,
                'remaining_credits' => 2,
                'booking_notes' => 'Initial consultation completed for a structured four-week reset program.',
                'consultation_notes' => 'Patient was advised to stabilize meal timing, prioritize protein intake, and begin a low-impact exercise routine.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 71.4,
                        'waist_cm' => 89.0,
                        'notes' => 'Energy is improving and meal timing is more consistent.',
                        'review_notes' => 'Good first-week adherence. Maintain hydration and daily walking.',
                    ],
                    [
                        'program_week' => 2,
                        'weight_kg' => 70.8,
                        'waist_cm' => 87.9,
                        'notes' => 'Reduced sugary snacks and maintained evening stretching.',
                        'review_notes' => 'Progress is visible. Keep the dinner portion balanced.',
                    ],
                    [
                        'program_week' => 3,
                        'weight_kg' => 70.1,
                        'waist_cm' => 86.8,
                        'notes' => 'Sleep quality improved and cravings are easier to manage.',
                        'review_notes' => null,
                    ],
                ],
            ],
            [
                'email' => 'nabila.maharani@moreclinic.test',
                'name' => 'Nabila Maharani',
                'phone' => '620000000102',
                'date_of_birth' => '1996-06-20',
                'address' => 'Bandung',
                'medical_notes' => 'Needs appetite regulation support and gradual recomposition planning.',
                'doctor_email' => 'ida.risma@moreclinic.test',
                'started_days_ago' => 24,
                'hour' => 10,
                'remaining_credits' => 1,
                'booking_notes' => 'Consultation completed with a focus on appetite regulation and strength recovery.',
                'consultation_notes' => 'Discussed calorie consistency, breakfast timing, and simple resistance training targets for the first month.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 67.8,
                        'waist_cm' => 83.5,
                        'notes' => 'Appetite is more stable after switching breakfast timing.',
                        'review_notes' => 'Progress is on track. Keep protein intake steady this week.',
                    ],
                    [
                        'program_week' => 2,
                        'weight_kg' => 66.9,
                        'waist_cm' => 82.0,
                        'notes' => 'Completed strength sessions and improved sleep this week.',
                        'review_notes' => 'Excellent compliance. Add one extra fiber-rich meal each day.',
                    ],
                    [
                        'program_week' => 3,
                        'weight_kg' => 66.5,
                        'waist_cm' => 81.3,
                        'notes' => 'Cravings are less frequent and training feels more sustainable.',
                        'review_notes' => null,
                    ],
                ],
            ],
            [
                'email' => 'ayu.lestari@moreclinic.test',
                'name' => 'Ayu Lestari',
                'phone' => '620000000103',
                'date_of_birth' => '1991-09-11',
                'address' => 'Surabaya',
                'medical_notes' => 'Working on abdominal bloating reduction and steady hydration habits.',
                'doctor_email' => 'rara.yunita@moreclinic.test',
                'started_days_ago' => 21,
                'hour' => 14,
                'remaining_credits' => 2,
                'booking_notes' => 'Consultation completed with focus on digestive comfort and lifestyle consistency.',
                'consultation_notes' => 'Recommended a lower-irritant meal structure, hydration targets, and simplified progress tracking.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 59.2,
                        'waist_cm' => 76.0,
                        'notes' => 'Following the meal plan well and tracking water intake daily.',
                        'review_notes' => 'Nice start. Keep your late-night snack portion controlled.',
                    ],
                    [
                        'program_week' => 2,
                        'weight_kg' => 58.9,
                        'waist_cm' => 75.2,
                        'notes' => 'Bloating episodes decreased after changing dinner choices.',
                        'review_notes' => null,
                    ],
                ],
            ],
            [
                'email' => 'dimas.pratama@moreclinic.test',
                'name' => 'Dimas Pratama',
                'phone' => '620000000104',
                'date_of_birth' => '1989-03-07',
                'address' => 'Yogyakarta',
                'medical_notes' => 'Needs sustainable fat-loss structure with realistic workday habits.',
                'doctor_email' => 'doctor.test@moreclinic.test',
                'started_days_ago' => 19,
                'hour' => 8,
                'remaining_credits' => 2,
                'booking_notes' => 'Consultation completed for office-friendly weight management planning.',
                'consultation_notes' => 'Reviewed late-night eating pattern, travel schedule, and step-count goals for program adherence.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 84.5,
                        'waist_cm' => 98.0,
                        'notes' => 'Reduced sweet drinks and started short walks after lunch.',
                        'review_notes' => 'Strong start. Keep the lunch portion steady on workdays.',
                    ],
                    [
                        'program_week' => 2,
                        'weight_kg' => 83.6,
                        'waist_cm' => 96.8,
                        'notes' => 'Walking target is easier to maintain than expected.',
                        'review_notes' => null,
                    ],
                ],
            ],
            [
                'email' => 'citra.wulandari@moreclinic.test',
                'name' => 'Citra Wulandari',
                'phone' => '620000000105',
                'date_of_birth' => '1994-12-02',
                'address' => 'Denpasar',
                'medical_notes' => 'Focused on skin-friendly nutrition and structured stress recovery.',
                'doctor_email' => 'rara.yunita@moreclinic.test',
                'started_days_ago' => 17,
                'hour' => 15,
                'remaining_credits' => 3,
                'booking_notes' => 'Consultation completed for a skin-health-oriented wellness program.',
                'consultation_notes' => 'Aligned meal rhythm, hydration, and sleep goals with visible skin recovery expectations.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 62.7,
                        'waist_cm' => 78.5,
                        'notes' => 'Hydration target met most days and breakouts are calmer.',
                        'review_notes' => 'Encouraging response. Keep processed snacks limited.',
                    ],
                    [
                        'program_week' => 2,
                        'weight_kg' => 62.3,
                        'waist_cm' => 77.8,
                        'notes' => 'Stress eating reduced after pre-planning evening meals.',
                        'review_notes' => null,
                    ],
                ],
            ],
            [
                'email' => 'fajar.nugroho@moreclinic.test',
                'name' => 'Fajar Nugroho',
                'phone' => '620000000106',
                'date_of_birth' => '1990-05-25',
                'address' => 'Semarang',
                'medical_notes' => 'Needs cardiometabolic habit support and practical meal prep structure.',
                'doctor_email' => 'doctor.test@moreclinic.test',
                'started_days_ago' => 15,
                'hour' => 9,
                'remaining_credits' => 1,
                'booking_notes' => 'Consultation completed for practical workweek meal-planning support.',
                'consultation_notes' => 'Set targets for meal prep consistency, portion awareness, and moderate evening activity.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 88.2,
                        'waist_cm' => 101.4,
                        'notes' => 'Meal prep worked well for lunch and reduced impulsive ordering.',
                        'review_notes' => 'Keep repeating the prep routine. Increase vegetables at dinner.',
                    ],
                    [
                        'program_week' => 2,
                        'weight_kg' => 87.5,
                        'waist_cm' => 100.1,
                        'notes' => 'Fewer skipped meals and better control during weekend outings.',
                        'review_notes' => null,
                    ],
                ],
            ],
            [
                'email' => 'maya.salsabila@moreclinic.test',
                'name' => 'Maya Salsabila',
                'phone' => '620000000107',
                'date_of_birth' => '1997-08-18',
                'address' => 'Malang',
                'medical_notes' => 'Needs menstrual-cycle-aware nutrition planning and energy support.',
                'doctor_email' => 'ida.risma@moreclinic.test',
                'started_days_ago' => 14,
                'hour' => 11,
                'remaining_credits' => 2,
                'booking_notes' => 'Consultation completed for fatigue reduction and sustainable cycle-aware planning.',
                'consultation_notes' => 'Recommended stable breakfast intake, iron-supportive meals, and lighter training during symptom-heavy days.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 64.0,
                        'waist_cm' => 80.7,
                        'notes' => 'Morning energy is more stable after adding breakfast consistently.',
                        'review_notes' => 'Good response. Continue tracking fatigue against your cycle.',
                    ],
                ],
            ],
            [
                'email' => 'putri.anindya@moreclinic.test',
                'name' => 'Putri Anindya',
                'phone' => '620000000108',
                'date_of_birth' => '1992-11-09',
                'address' => 'Makassar',
                'medical_notes' => 'Improving satiety and reducing erratic meal timing after shift work.',
                'doctor_email' => 'rara.yunita@moreclinic.test',
                'started_days_ago' => 12,
                'hour' => 13,
                'remaining_credits' => 2,
                'booking_notes' => 'Consultation completed for shift-work-compatible nutrition habits.',
                'consultation_notes' => 'Built a simplified meal pattern around rotating work hours and recovery sleep blocks.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 69.4,
                        'waist_cm' => 85.2,
                        'notes' => 'Prepared snacks made long shifts easier and reduced late-night overeating.',
                        'review_notes' => 'Keep snack timing predictable and protect sleep where possible.',
                    ],
                ],
            ],
            [
                'email' => 'reza.saputra@moreclinic.test',
                'name' => 'Reza Saputra',
                'phone' => '620000000109',
                'date_of_birth' => '1988-01-30',
                'address' => 'Bekasi',
                'medical_notes' => 'Needs blood-sugar-friendly routine and improved evening activity consistency.',
                'doctor_email' => 'doctor.test@moreclinic.test',
                'started_days_ago' => 10,
                'hour' => 10,
                'remaining_credits' => 3,
                'booking_notes' => 'Consultation completed for steady routine building and sugar intake control.',
                'consultation_notes' => 'Focused on beverage substitutions, meal spacing, and realistic activity targets after office hours.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 79.8,
                        'waist_cm' => 93.4,
                        'notes' => 'Sugary drinks dropped sharply and evening walks happened four times.',
                        'review_notes' => null,
                    ],
                ],
            ],
            [
                'email' => 'bella.kurnia@moreclinic.test',
                'name' => 'Bella Kurnia',
                'phone' => '620000000110',
                'date_of_birth' => '1995-04-16',
                'address' => 'Bogor',
                'medical_notes' => 'Focused on post-holiday reset and consistent hydration habits.',
                'doctor_email' => 'ida.risma@moreclinic.test',
                'started_days_ago' => 8,
                'hour' => 9,
                'remaining_credits' => 2,
                'booking_notes' => 'Consultation completed for a reset program after recent routine disruption.',
                'consultation_notes' => 'Set realistic nutrition targets, hydration reminders, and gradual exercise re-entry for the next month.',
                'check_ins' => [
                    [
                        'program_week' => 1,
                        'weight_kg' => 61.5,
                        'waist_cm' => 77.1,
                        'notes' => 'Hydration reminders helped and meals are less reactive now.',
                        'review_notes' => null,
                    ],
                ],
            ],
        ];
    }
}
