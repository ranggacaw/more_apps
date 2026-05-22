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
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(DemoUsersSeeder::class);

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

        $ida = $this->seedDoctorAvailability('ida.risma@moreclinic.test', 1, '09:00', '12:00');
        $rara = $this->seedDoctorAvailability('rara.yunita@moreclinic.test', 3, '13:00', '16:00');

        app(TimeSlotService::class)->generateUpcomingSlots($ida, 14);
        app(TimeSlotService::class)->generateUpcomingSlots($rara, 14);

        $this->seedActiveProgramPatient(
            patientEmail: 'sinta.putri@moreclinic.test',
            doctorEmail: 'ida.risma@moreclinic.test',
            package: $package,
            startedAt: now()->subDays(21)->setTime(9, 0),
            remainingCredits: 2,
            checkIns: [
                [
                    'program_week' => 1,
                    'weight_kg' => 71.4,
                    'waist_cm' => 89.0,
                    'notes' => 'Energy is improving and meal timing is more consistent.',
                    'review_notes' => 'Good first-week adherence. Maintain hydration and daily walking.',
                ],
            ],
        );

        $this->seedActiveProgramPatient(
            patientEmail: 'nabila.maharani@moreclinic.test',
            doctorEmail: 'ida.risma@moreclinic.test',
            package: $package,
            startedAt: now()->subDays(14)->setTime(10, 0),
            remainingCredits: 1,
            checkIns: [
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
                    'review_notes' => null,
                ],
            ],
        );

        $this->seedActiveProgramPatient(
            patientEmail: 'ayu.lestari@moreclinic.test',
            doctorEmail: 'rara.yunita@moreclinic.test',
            package: $package,
            startedAt: now()->subDays(8)->setTime(14, 0),
            remainingCredits: 3,
            checkIns: [
                [
                    'program_week' => 1,
                    'weight_kg' => 59.2,
                    'waist_cm' => 76.0,
                    'notes' => 'Following the meal plan well and tracking water intake daily.',
                    'review_notes' => 'Nice start. Keep your late-night snack portion controlled.',
                ],
            ],
        );

        $this->seedLockedMeetingPatient(
            patientEmail: 'dimas.pratama@moreclinic.test',
            doctorEmail: 'ida.risma@moreclinic.test',
            startsAt: now()->addDays(2)->setTime(10, 0),
        );

        $this->seedLockedMeetingPatient(
            patientEmail: 'citra.wulandari@moreclinic.test',
            doctorEmail: 'rara.yunita@moreclinic.test',
            startsAt: now()->addDays(3)->setTime(14, 0),
        );
    }

    private function seedDoctorAvailability(string $doctorEmail, int $dayOfWeek, string $startTime, string $endTime): DoctorAvailability
    {
        $doctorUser = User::query()->where('email', $doctorEmail)->firstOrFail();
        $doctor = Doctor::query()->where('user_id', $doctorUser->id)->firstOrFail();

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

    /**
     * @param  list<array{program_week:int, weight_kg:float, waist_cm:float, notes:string, review_notes:?string}>  $checkIns
     */
    private function seedActiveProgramPatient(
        string $patientEmail,
        string $doctorEmail,
        Package $package,
        Carbon $startedAt,
        int $remainingCredits,
        array $checkIns,
    ): void {
        $patient = User::query()->where('email', $patientEmail)->firstOrFail();
        $doctor = Doctor::query()->whereHas('user', fn ($query) => $query->where('email', $doctorEmail))->firstOrFail();

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

        $booking = Booking::query()->updateOrCreate(
            [
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
            ],
            [
                'status' => 'completed',
                'notes' => 'Seeded completed consultation for active program tracking.',
                'meeting_link' => sprintf('https://meet.moreclinic.test/%s-program', str($patient->email)->before('@')),
            ],
        );

        $consultationPayment = Payment::query()->updateOrCreate(
            ['midtrans_order_id' => sprintf('seed-consultation-%s', str($patient->email)->before('@'))],
            [
                'user_id' => $patient->id,
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
                'payload' => ['seeded' => true, 'scenario' => 'program_consultation'],
            ],
        );

        $packagePayment = Payment::query()->updateOrCreate(
            ['midtrans_order_id' => sprintf('seed-package-%s', str($patient->email)->before('@'))],
            [
                'user_id' => $patient->id,
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
                'payload' => ['seeded' => true, 'scenario' => 'program_package'],
            ],
        );

        $userPackage = UserPackage::query()->updateOrCreate(
            [
                'user_id' => $patient->id,
                'payment_id' => $packagePayment->id,
            ],
            [
                'package_id' => $package->id,
                'status' => $remainingCredits > 0 ? 'active' : 'completed',
                'consultation_credits_total' => $package->consultation_credits,
                'consultation_credits_remaining' => $remainingCredits,
                'activated_at' => $startedAt->copy()->addDay(),
                'expires_at' => $startedAt->copy()->addDays($package->duration_days),
                'metadata' => ['seeded' => true],
            ],
        );

        Consultation::query()->updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'recommended_package_id' => $package->id,
                'user_package_id' => $userPackage->id,
                'notes' => 'Seeded consultation notes for an active wellness program.',
                'meal_plan_pdf_path' => null,
                'completed_at' => $startedAt->copy()->addHour(),
            ],
        );

        $patient->update([
            'consultation_credit' => 500000,
            'consultation_credit_awarded_at' => $startedAt->copy(),
            'consultation_credit_expires_at' => $startedAt->copy()->addDays((int) config('clinic.consultation_credit_expires_days', 30)),
            'consultation_credit_consumed_at' => $startedAt->copy()->addDay(),
            'consultation_credit_payment_id' => $consultationPayment->id,
        ]);

        foreach ($checkIns as $checkIn) {
            CheckIn::query()->updateOrCreate(
                [
                    'user_package_id' => $userPackage->id,
                    'program_week' => $checkIn['program_week'],
                ],
                [
                    'booking_id' => null,
                    'consultation_id' => $booking->consultation?->id,
                    'user_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'weight_kg' => $checkIn['weight_kg'],
                    'waist_cm' => $checkIn['waist_cm'],
                    'notes' => $checkIn['notes'],
                    'progress_photo_path' => null,
                    'review_notes' => $checkIn['review_notes'],
                    'remaining_consultations_after' => $remainingCredits,
                    'checked_in_at' => $startedAt->copy()->addWeeks($checkIn['program_week'])->subDay(),
                    'reviewed_at' => $checkIn['review_notes'] ? $startedAt->copy()->addWeeks($checkIn['program_week']) : null,
                ],
            );
        }
    }

    private function seedLockedMeetingPatient(string $patientEmail, string $doctorEmail, Carbon $startsAt): void
    {
        $patient = User::query()->where('email', $patientEmail)->firstOrFail();
        $doctor = Doctor::query()->whereHas('user', fn ($query) => $query->where('email', $doctorEmail))->firstOrFail();

        $slot = TimeSlot::query()->updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'start_time' => $startsAt->copy(),
            ],
            [
                'end_time' => $startsAt->copy()->addMinutes(30),
                'status' => 'locked',
                'availability_id' => null,
                'locked_until' => now()->addMinutes(15),
                'locked_by_user_id' => $patient->id,
            ],
        );

        $booking = Booking::query()->updateOrCreate(
            [
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
            ],
            [
                'status' => 'pending',
                'notes' => 'Seeded pending booking that is still inside the slot lock window.',
                'meeting_link' => null,
            ],
        );

        Payment::query()->updateOrCreate(
            ['midtrans_order_id' => sprintf('seed-locked-%s', str($patient->email)->before('@'))],
            [
                'user_id' => $patient->id,
                'booking_id' => $booking->id,
                'package_id' => null,
                'attempt_number' => 1,
                'type' => 'consultation',
                'amount' => 500000,
                'consultation_credit_applied' => 0,
                'consultation_credit_source_payment_id' => null,
                'provider' => 'midtrans',
                'snap_token' => null,
                'status' => 'pending',
                'paid_at' => null,
                'payload' => ['seeded' => true, 'scenario' => 'locked_meeting'],
            ],
        );
    }
}
