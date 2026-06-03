<?php

namespace Tests\Feature;

use App\Models\AestheticProgram;
use App\Models\Booking;
use App\Models\ClinicOperatingHour;
use App\Models\Consultation;
use App\Models\ConsultationPackageOption;
use App\Models\Doctor;
use App\Models\Package;
use App\Models\Payment;
use App\Models\TimeSlot;
use App\Models\User;
use App\Services\FinanceReportService;
use App\Services\TimeSlotService;
use Database\Seeders\ConsultationTreatmentBillingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ConsultationTreatmentBillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_manages_aesthetic_programs_with_margin_and_doctor_payload_hides_hpp(): void
    {
        Queue::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => null]);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(16, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'self_service',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.aesthetic-programs.store'), [
                'name' => 'Bright Peel',
                'price' => 900000,
                'hpp_amount' => 300000,
                'is_active' => true,
            ])
            ->assertRedirect();

        $program = AestheticProgram::firstOrFail();

        $this->actingAs($admin)
            ->get(route('admin.aesthetic-programs.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AestheticPrograms')
                ->where('programs.0.gross_margin', 600000));

        $this->actingAs($admin)
            ->patch(route('admin.aesthetic-programs.update', $program), [
                'name' => 'Bright Peel Plus',
                'price' => 950000,
                'hpp_amount' => 350000,
                'is_active' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('aesthetic_programs', [
            'id' => $program->id,
            'name' => 'Bright Peel Plus',
            'is_active' => false,
        ]);

        $program->refresh()->update(['is_active' => true]);

        $this->actingAs($doctorUser)
            ->get(route('doctor.consultations.show', $booking))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Doctor/ConsultationWorkspace')
                ->has('aestheticPrograms.0.id')
                ->has('aestheticPrograms.0.name')
                ->has('aestheticPrograms.0.price')
                ->missing('aestheticPrograms.0.hpp_amount'));
    }

    public function test_doctor_completion_snapshots_treatments_and_creates_pending_internal_payment(): void
    {
        Queue::fake();
        $this->seed(ConsultationTreatmentBillingSeeder::class);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => null]);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(16, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'self_service',
        ]);
        $program = AestheticProgram::create([
            'name' => 'Lift Booster',
            'price' => 800000,
            'hpp_amount' => 250000,
            'is_active' => true,
        ]);
        $diamond = ConsultationPackageOption::where('name', 'Diamond Trial')->firstOrFail();

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Treatment completed safely.',
                'recommended_package_id' => null,
                'package_option_id' => $diamond->id,
                'diamond_oral_addon' => true,
                'package_dosage_value' => null,
                'package_dosage_unit' => '',
                'aesthetic_program_lines' => [[
                    'aesthetic_program_id' => $program->id,
                    'quantity' => 2,
                    'dosage_value' => 1.5,
                    'dosage_unit' => 'ml',
                    'notes' => 'Cheeks',
                ]],
                'manual_treatment_lines' => [[
                    'name' => 'Manual Ampoule',
                    'quantity' => 1,
                    'unit_price' => 100000,
                    'dosage_value' => null,
                    'dosage_unit' => '',
                ]],
            ])
            ->assertRedirect(route('doctor.consultations.index'));

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'completed']);
        $this->assertDatabaseCount('consultation_line_items', 4);
        $this->assertDatabaseHas('consultation_line_items', [
            'type' => 'aesthetic_program',
            'name' => 'Lift Booster',
            'quantity' => 2,
            'unit_price' => 800000,
            'hpp_amount' => 250000,
            'line_total' => 1600000,
        ]);
        $this->assertDatabaseHas('consultation_line_items', [
            'type' => 'manual_treatment',
            'name' => 'Manual Ampoule',
            'dosage_unit' => 'ml',
        ]);
        $this->assertDatabaseHas('payments', [
            'user_id' => $patient->id,
            'booking_id' => $booking->id,
            'type' => 'consultation_treatment',
            'provider' => 'internal',
            'status' => 'pending',
            'amount' => 4200000,
            'hpp_amount' => 500000,
            'snap_token' => null,
        ]);
        $this->assertDatabaseMissing('user_packages', ['user_id' => $patient->id]);
    }

    public function test_diamond_addon_requires_diamond_primary_option(): void
    {
        $this->seed(ConsultationTreatmentBillingSeeder::class);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => null]);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(16, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'self_service',
        ]);
        $basic = ConsultationPackageOption::where('name', 'Basic Trial')->firstOrFail();

        $this->actingAs($doctorUser)
            ->from(route('doctor.consultations.show', $booking))
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Treatment completed safely.',
                'package_option_id' => $basic->id,
                'diamond_oral_addon' => true,
            ])
            ->assertStatus(422);

        $this->assertDatabaseMissing('consultations', ['booking_id' => $booking->id]);
    }

    public function test_doctor_package_selection_creates_admin_invoice_and_admin_finalizes_credits(): void
    {
        Queue::fake();
        $admin = User::factory()->create(['role' => 'admin']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => null]);
        $package = Package::create([
            'name' => 'Slimming Care',
            'slug' => 'slimming-care',
            'price' => 2500000,
            'consultation_credits' => 4,
            'is_active' => true,
        ]);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(16, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'booking_source' => 'admin_assisted',
            'consultation_mode' => 'offline',
        ]);

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => '',
                'recommended_package_id' => $package->id,
                'slimming_weight_kg' => 64.5,
                'slimming_bmi' => 23.4,
            ])
            ->assertRedirect(route('doctor.consultations.index'));

        $this->assertDatabaseHas('consultations', [
            'booking_id' => $booking->id,
            'recommended_package_id' => $package->id,
            'slimming_weight_kg' => 64.5,
        ]);
        $this->assertDatabaseHas('payments', [
            'user_id' => $patient->id,
            'booking_id' => $booking->id,
            'package_id' => $package->id,
            'type' => 'package',
            'provider' => 'internal',
            'status' => 'pending',
            'amount' => 2500000,
        ]);

        $invoice = $booking->payments()->where('type', 'package')->firstOrFail();

        $this->actingAs($admin)
            ->patch(route('admin.invoices.finalize', $invoice))
            ->assertRedirect();

        $this->assertDatabaseHas('payments', [
            'id' => $invoice->id,
            'status' => 'paid',
        ]);
        $this->assertDatabaseHas('user_packages', [
            'user_id' => $patient->id,
            'package_id' => $package->id,
            'payment_id' => $invoice->id,
            'consultation_credits_total' => 4,
            'consultation_credits_remaining' => 4,
        ]);
    }

    public function test_admin_finalizes_pending_internal_treatment_payment_without_package_entitlements(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-01 12:00:00'));

        try {
            Queue::fake();
            $admin = User::factory()->create(['role' => 'admin']);
            [$doctorUser, $doctor] = $this->createDoctorFixture();
            $patient = User::factory()->create(['role' => null]);
            $slot = $this->createSlot($doctor, now()->addDay()->setTime(16, 0), 'booked');
            $booking = Booking::create([
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'status' => 'confirmed',
                'booking_source' => 'admin_assisted',
                'consultation_mode' => 'offline',
            ]);
            $consultation = Consultation::create([
                'booking_id' => $booking->id,
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'notes' => 'Treatment billing handoff.',
                'completed_at' => now(),
            ]);
            $payment = Payment::create([
                'user_id' => $patient->id,
                'booking_id' => $booking->id,
                'consultation_id' => $consultation->id,
                'attempt_number' => 1,
                'type' => 'consultation_treatment',
                'amount' => 1200000,
                'hpp_amount' => 300000,
                'provider' => 'internal',
                'midtrans_order_id' => 'treatment-finalize-1',
                'status' => 'pending',
                'payload' => ['source' => 'consultation_completion'],
            ]);

            $reportBefore = app(FinanceReportService::class)->profitAndLoss(now()->startOfDay(), now()->endOfDay());
            $this->assertSame(0, $reportBefore['gross_revenue']);

            $this->actingAs($admin)
                ->patch(route('admin.payments.finalize-treatment', $payment))
                ->assertRedirect();

            $payment->refresh();
            $this->assertSame('paid', $payment->status);
            $this->assertNotNull($payment->paid_at);
            $this->assertSame($admin->id, $payment->payload['finalized_by_user_id']);
            $this->assertDatabaseMissing('user_packages', ['user_id' => $patient->id]);

            $reportAfter = app(FinanceReportService::class)->profitAndLoss(now()->startOfDay(), now()->endOfDay());
            $this->assertSame(1200000, $reportAfter['gross_revenue']);
            $this->assertSame(300000, $reportAfter['hpp']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_admin_cannot_finalize_ineligible_treatment_payment_records(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $pendingMidtransPayment = Payment::create([
            'attempt_number' => 1,
            'type' => 'consultation_treatment',
            'amount' => 500000,
            'provider' => 'midtrans',
            'midtrans_order_id' => 'midtrans-treatment-1',
            'status' => 'pending',
        ]);
        $paidInternalPayment = Payment::create([
            'attempt_number' => 1,
            'type' => 'consultation_treatment',
            'amount' => 500000,
            'provider' => 'internal',
            'midtrans_order_id' => 'paid-treatment-1',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.payments.finalize-treatment', $pendingMidtransPayment))
            ->assertNotFound();

        $this->actingAs($admin)
            ->patch(route('admin.payments.finalize-treatment', $paidInternalPayment))
            ->assertStatus(422);

        $this->assertSame('pending', $pendingMidtransPayment->fresh()->status);
        $this->assertSame('paid', $paidInternalPayment->fresh()->status);
    }

    public function test_clinic_hours_filter_admin_slots_and_reject_standard_outside_hours_booking(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-01 08:00:00'));
        $admin = User::factory()->create(['role' => 'admin']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        ClinicOperatingHour::create([
            'day_of_week' => 2,
            'start_time' => '16:00:00',
            'end_time' => '20:00:00',
            'is_active' => true,
        ]);

        $this->assertFalse(app(TimeSlotService::class)->isDateTimeRangeWithinClinicHours(
            Carbon::parse('2026-06-02 09:00:00'),
            Carbon::parse('2026-06-02 09:30:00'),
        ));
        $this->assertSame('2026-06-02 16:00:00', app(TimeSlotService::class)
            ->getReservableSlotsForDoctorAndDate($doctor, '2026-06-02')
            ->first()
            ?->start_time
            ?->toDateTimeString());

        $response = $this->actingAs($admin)
            ->getJson(route('admin.admin.slots', ['doctor_id' => $doctor->id, 'date' => '2026-06-02']))
            ->assertOk();

        $this->assertSame('16:00', $response->json('clinic_hours.0.start_time'));
        $outsideSlot = $this->createSlot($doctor, Carbon::parse('2026-06-02 15:00:00'));

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $outsideSlot->id,
                'consultation_mode' => 'offline',
                'patient_type' => 'guest',
                'guest_patient_name' => 'Walk-in Guest',
                'guest_whatsapp' => '628123456789',
            ])
            ->assertStatus(422);

        Carbon::setTestNow();
    }

    public function test_admin_outside_hours_booking_requires_reason_and_records_override(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-06-01 08:00:00'));
        $admin = User::factory()->create(['role' => 'admin']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();
        $patient = User::factory()->create(['role' => null]);
        ClinicOperatingHour::create([
            'day_of_week' => 2,
            'start_time' => '16:00:00',
            'end_time' => '20:00:00',
            'is_active' => true,
        ]);
        $slot = $this->createSlot($doctor, Carbon::parse('2026-06-02 15:00:00'));

        $payload = [
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'consultation_mode' => 'offline',
            'patient_type' => 'registered',
            'user_id' => $patient->id,
            'override_clinic_hours' => true,
        ];

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), $payload)
            ->assertStatus(422);

        $this->actingAs($admin)
            ->post(route('admin.bookings.store'), $payload + ['override_reason' => 'Patient has urgent travel.'])
            ->assertRedirect(route('admin.bookings.index'));

        $this->assertDatabaseHas('schedule_override_logs', [
            'admin_user_id' => $admin->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'reason' => 'Patient has urgent travel.',
        ]);

        Carbon::setTestNow();
    }

    private function createDoctorFixture(): array
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        return [$doctorUser, $doctor];
    }

    private function createSlot(Doctor $doctor, Carbon $startTime, string $status = 'available'): TimeSlot
    {
        return TimeSlot::create([
            'doctor_id' => $doctor->id,
            'start_time' => $startTime,
            'end_time' => $startTime->copy()->addMinutes(30),
            'status' => $status,
        ]);
    }
}
