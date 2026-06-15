<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\ClinicQueueEntry;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoArrivalQueueSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $admin = User::query()->where('email', 'admin@moreclinic.test')->firstOrFail();
        $doctorIda = Doctor::query()->whereHas('user', fn ($query) => $query->where('email', 'ida.risma@moreclinic.test'))->firstOrFail();
        $doctorRara = Doctor::query()->whereHas('user', fn ($query) => $query->where('email', 'rara.yunita@moreclinic.test'))->firstOrFail();

        $patients = [
            'arrival-not-yet' => $this->patient('arrival.notyet@moreclinic.test', 'Arrival Not Yet', '620000000201'),
            'arrival-booking-waiting' => $this->patient('arrival.booking.waiting@moreclinic.test', 'Arrival Booking Waiting', '620000000202'),
            'arrival-booking-called' => $this->patient('arrival.booking.called@moreclinic.test', 'Arrival Booking Called', '620000000203'),
        ];

        $notArrived = $this->booking($patients['arrival-not-yet'], $admin, $doctorIda, 16, 0, 'Not arrived demo booking. Use Check in or No-show from Admin Queue.');
        $bookingWaiting = $this->booking($patients['arrival-booking-waiting'], $admin, $doctorIda, 16, 30, 'Checked-in booking waiting for doctor call.');
        $bookingCalled = $this->booking($patients['arrival-booking-called'], $admin, $doctorRara, 17, 0, 'Called booking ready for doctor start.');

        ClinicQueueEntry::query()->whereIn('patient_phone', [
            '620000000202',
            '620000000203',
            '620000000204',
            '620000000205',
        ])->delete();

        $this->queueEntry([
            'source_type' => 'booking',
            'booking_id' => $bookingWaiting->id,
            'patient_name' => $bookingWaiting->patientDisplayName(),
            'patient_phone' => $bookingWaiting->patientContactPhone(),
            'complaint_notes' => $bookingWaiting->notes,
            'doctor_id' => $bookingWaiting->doctor_id,
        ]);

        $called = $this->queueEntry([
            'source_type' => 'booking',
            'booking_id' => $bookingCalled->id,
            'patient_name' => $bookingCalled->patientDisplayName(),
            'patient_phone' => $bookingCalled->patientContactPhone(),
            'complaint_notes' => $bookingCalled->notes,
            'doctor_id' => $bookingCalled->doctor_id,
        ]);
        $called->update([
            'status' => 'assigned',
            'called_at' => now()->subMinutes(10),
            'assigned_at' => now()->subMinutes(10),
        ]);

        $this->queueEntry([
            'source_type' => 'walk_in',
            'patient_name' => 'Walk In Assignable',
            'patient_phone' => '620000000204',
            'complaint_notes' => 'Walk-in demo patient. Use Assign or Cancel from Admin Queue.',
            'doctor_id' => null,
        ]);

        $this->queueEntry([
            'source_type' => 'walk_in',
            'patient_name' => 'Walk In Doctor Queue',
            'patient_phone' => '620000000205',
            'complaint_notes' => 'Walk-in assigned to doctor and waiting to be called.',
            'doctor_id' => $doctorIda->id,
            'assigned_at' => now()->subMinutes(5),
        ]);

        $this->command?->info('Arrival queue seeded: 1 not-arrived booking, 2 booking queue entries, and 2 walk-ins for button testing.');
        $this->command?->info('Seeded login accounts use password: password');
        $this->command?->info('Admin: admin@moreclinic.test | Doctors: ida.risma@moreclinic.test, rara.yunita@moreclinic.test');
    }

    private function patient(string $email, string $name, string $phone): User
    {
        return User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'phone' => $phone,
                'role' => null,
                'email_verified_at' => now(),
                'password' => 'password',
            ],
        );
    }

    private function booking(User $patient, User $admin, Doctor $doctor, int $hour, int $minute, string $notes): Booking
    {
        $start = now()->setTime($hour, $minute);
        $slot = TimeSlot::query()->updateOrCreate(
            ['doctor_id' => $doctor->id, 'start_time' => $start],
            [
                'end_time' => $start->copy()->addMinutes(30),
                'status' => 'booked',
                'availability_id' => null,
                'locked_until' => null,
                'locked_by_user_id' => null,
            ],
        );

        return Booking::query()->updateOrCreate(
            ['slot_id' => $slot->id],
            [
                'user_id' => $patient->id,
                'booked_by_admin_id' => $admin->id,
                'doctor_id' => $doctor->id,
                'status' => 'confirmed',
                'booking_source' => 'admin_assisted',
                'consultation_mode' => 'offline',
                'guest_patient_name' => null,
                'guest_whatsapp' => null,
                'notes' => $notes,
                'no_show_at' => null,
            ],
        );
    }

    private function queueEntry(array $attributes): ClinicQueueEntry
    {
        return ClinicQueueEntry::createWithNextQueueNumber([
            'status' => 'waiting',
            'queued_at' => now(),
            ...$attributes,
        ]);
    }
}
