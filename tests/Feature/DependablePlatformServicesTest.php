<?php

namespace Tests\Feature;

use App\Jobs\SendPatientOtpJob;
use App\Jobs\SendBookingNotificationJob;
use App\Jobs\SendUserPackageNotificationJob;
use App\Models\Booking;
use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Package;
use App\Models\Payment;
use App\Models\TimeSlot;
use App\Models\User;
use App\Services\BookingReminderService;
use App\Services\EmailNotificationService;
use App\Services\MeetingLinkService;
use App\Services\TimeSlotService;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DependablePlatformServicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_stays_patient_only_and_queues_verification_delivery(): void
    {
        Queue::fake();

        $response = $this->post('/register', [
            'name' => 'Alya',
            'email' => 'alya-platform@example.com',
            'phone' => '620000000120',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ]);

        $response->assertRedirect(route('verification.notice', absolute: false));

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'alya-platform@example.com',
            'role' => 'patient',
        ]);

        Queue::assertPushed(SendPatientOtpJob::class);
    }

    public function test_unverified_patient_is_redirected_to_verification_before_booking(): void
    {
        $patient = User::factory()->unverified()->create(['role' => 'patient']);

        $this->actingAs($patient)
            ->get(route('bookings.create'))
            ->assertRedirect(route('verification.notice'));
    }

    public function test_doctor_cannot_access_patient_booking_support_apis(): void
    {
        [$doctorUser] = $this->createDoctor();

        $this->actingAs($doctorUser)
            ->getJson(route('api.doctors'))
            ->assertForbidden();
    }

    public function test_patient_cannot_trigger_doctor_completion_action(): void
    {
        [$doctorUser, $doctor] = $this->createDoctor();
        $patient = User::factory()->create(['role' => 'patient']);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');

        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
        ]);

        $this->actingAs($patient)
            ->post(route('doctor.bookings.complete', $booking), [])
            ->assertForbidden();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
        ]);
    }

    public function test_doctor_completion_requires_the_assigned_doctor_and_a_confirmed_booking(): void
    {
        [$doctorUser, $doctor] = $this->createDoctor();
        [$otherDoctorUser] = $this->createDoctor();
        $patient = User::factory()->create(['role' => 'patient']);

        $confirmedBooking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked')->id,
            'status' => 'confirmed',
        ]);

        $pendingBooking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $this->createSlot($doctor, now()->addDay()->setTime(11, 0), 'locked', $patient)->id,
            'status' => 'pending',
        ]);

        $this->actingAs($otherDoctorUser)
            ->post(route('doctor.bookings.complete', $confirmedBooking), ['notes' => 'Unauthorized attempt.'])
            ->assertForbidden();

        $this->actingAs($doctorUser)
            ->post(route('doctor.bookings.complete', $pendingBooking), ['notes' => 'Too early to complete.'])
            ->assertForbidden();

        $this->assertDatabaseHas('bookings', [
            'id' => $confirmedBooking->id,
            'status' => 'confirmed',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $pendingBooking->id,
            'status' => 'pending',
        ]);
        $this->assertSame(0, Consultation::query()->count());
    }

    public function test_doctor_completion_persists_consultation_and_queues_patient_follow_up(): void
    {
        Queue::fake([SendBookingNotificationJob::class]);

        [$doctorUser, $doctor] = $this->createDoctor();
        $patient = User::factory()->create(['role' => 'patient']);
        $package = Package::create([
            'name' => 'Glow Reset',
            'slug' => 'glow-reset',
            'price' => 900000,
            'consultation_credits' => 3,
            'is_active' => true,
        ]);

        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $this->createSlot($doctor, now()->addDay()->setTime(14, 0), 'booked')->id,
            'status' => 'confirmed',
        ]);

        $this->actingAs($doctorUser)
            ->from(route('doctor.dashboard'))
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Reviewed skin response and recommended a structured follow-up package.',
                'recommended_package_id' => $package->id,
            ])
            ->assertRedirect(route('doctor.consultations.index'));

        $this->assertDatabaseHas('consultations', [
            'booking_id' => $booking->id,
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'recommended_package_id' => $package->id,
            'notes' => 'Reviewed skin response and recommended a structured follow-up package.',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'completed',
        ]);
        $this->assertSame(1, Consultation::query()->where('booking_id', $booking->id)->count());

        Queue::assertPushed(SendBookingNotificationJob::class, fn (SendBookingNotificationJob $job) => $job->type === 'completion-follow-up' && $job->booking->is($booking));
    }

    public function test_midtrans_webhook_rejects_invalid_signature_without_mutating_records(): void
    {
        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        [, , , $slot, $booking, $payment] = $this->createPendingBookingFixture();

        $this->postJson(route('payments.webhook'), [
            'order_id' => $payment->midtrans_order_id,
            'transaction_status' => 'settlement',
            'gross_amount' => (string) $payment->amount,
            'status_code' => '200',
            'signature_key' => 'invalid-signature',
        ])->assertForbidden();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'locked',
        ]);
    }

    public function test_midtrans_webhook_rejects_unsigned_requests_when_demo_mode_is_active(): void
    {
        config([
            'midtrans.server_key' => null,
            'midtrans.client_key' => null,
        ]);

        [, , , $slot, $booking, $payment] = $this->createPendingBookingFixture();

        $this->postJson(route('payments.webhook'), [
            'order_id' => $payment->midtrans_order_id,
            'transaction_status' => 'settlement',
            'gross_amount' => (string) $payment->amount,
            'status_code' => '200',
        ])->assertForbidden();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'locked',
        ]);
    }

    public function test_consultation_checkout_initializes_fixed_fee_and_returns_payment_handoff_data(): void
    {
        config([
            'clinic.consultation_fee' => 500000,
            'midtrans.server_key' => null,
            'midtrans.client_key' => null,
        ]);

        [$patient, , , $slot, $booking, $payment] = $this->createPendingBookingFixture(true, 650000);

        $response = $this->actingAs($patient)
            ->postJson(route('payments.init'), ['booking_id' => $booking->id])
            ->assertOk();

        $newPayment = $booking->fresh('payment')->payment;

        $response
            ->assertJsonPath('data.booking.id', $booking->id)
            ->assertJsonPath('data.payment.id', $newPayment->id)
            ->assertJsonPath('data.payment.amount', 500000)
            ->assertJsonPath('data.payment.status', 'pending')
            ->assertJsonPath('data.payment.attempt_number', 2)
            ->assertJsonPath('data.payment.can_continue_checkout', true)
            ->assertJsonPath('data.midtrans.is_demo', true);

        $this->assertNotSame($payment->id, $newPayment->id);
        $this->assertNotSame($payment->midtrans_order_id, $newPayment->midtrans_order_id);
        $this->assertSame(500000, $newPayment->amount);
        $this->assertSame('failed', $payment->fresh()->status);
        $this->assertTrue($slot->fresh()->locked_until?->isFuture());
    }

    public function test_midtrans_webhook_rejects_amount_mismatch_without_mutating_records(): void
    {
        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        [, , , $slot, $booking, $payment] = $this->createPendingBookingFixture();
        $grossAmount = '400000';
        $statusCode = '200';

        $this->postJson(route('payments.webhook'), [
            'order_id' => $payment->midtrans_order_id,
            'transaction_status' => 'settlement',
            'gross_amount' => $grossAmount,
            'status_code' => $statusCode,
            'signature_key' => hash('sha512', $payment->midtrans_order_id.$statusCode.$grossAmount.config('midtrans.server_key')),
        ])->assertStatus(422);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'locked',
        ]);
    }

    public function test_pending_midtrans_callback_preserves_pending_records(): void
    {
        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        [, , , $slot, $booking, $payment] = $this->createPendingBookingFixture();

        $this->postJson(route('payments.webhook'), $this->validMidtransPayload($payment, 'pending'))
            ->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'locked',
        ]);
        $this->assertSame('pending', $payment->fresh()->payload['latest']['transaction_status']);
    }

    public function test_terminal_failed_midtrans_callbacks_release_the_reserved_slot(): void
    {
        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        foreach (['deny', 'cancel', 'expire', 'failure'] as $status) {
            [, , , $slot, $booking, $payment] = $this->createPendingBookingFixture();

            $this->postJson(route('payments.webhook'), $this->validMidtransPayload($payment, $status))
                ->assertOk();

            $this->assertDatabaseHas('payments', [
                'id' => $payment->id,
                'status' => 'failed',
            ]);
            $this->assertDatabaseHas('bookings', [
                'id' => $booking->id,
                'status' => 'cancelled',
            ]);
            $this->assertDatabaseHas('time_slots', [
                'id' => $slot->id,
                'status' => 'available',
            ]);
        }
    }

    public function test_midtrans_webhook_is_idempotent_and_queues_confirmation_once(): void
    {
        Queue::fake([SendBookingNotificationJob::class]);

        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        [, , , $slot, $booking, $payment] = $this->createPendingBookingFixture();
        $payload = $this->validMidtransPayload($payment, 'settlement');

        $this->postJson(route('payments.webhook'), $payload)->assertOk();
        $this->postJson(route('payments.webhook'), $payload)->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'paid',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'booked',
        ]);
        $this->assertNotNull($booking->fresh()->meeting_link);

        Queue::assertPushed(SendBookingNotificationJob::class, 1);
    }

    public function test_successful_consultation_payment_awards_credit_state(): void
    {
        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        [$patient, , , , , $payment] = $this->createPendingBookingFixture();

        $this->postJson(route('payments.webhook'), $this->validMidtransPayload($payment, 'settlement'))
            ->assertOk();

        $patient->refresh();

        $this->assertSame(500000, $patient->consultation_credit);
        $this->assertSame($payment->id, $patient->consultation_credit_payment_id);
        $this->assertNotNull($patient->consultation_credit_awarded_at);
        $this->assertNotNull($patient->consultation_credit_expires_at);
        $this->assertNull($patient->consultation_credit_consumed_at);
    }

    public function test_patient_package_catalog_shows_credit_adjusted_pricing_and_eligibility(): void
    {
        [$patient] = $this->createCompletedConsultationCreditFixture();
        $package = $this->createPackage(price: 900000, credits: 3, name: 'Glow Reset');

        $this->actingAs($patient)
            ->get(route('patient.packages.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/Packages')
                ->where('credit.amount', 500000)
                ->where('credit.is_eligible', true)
                ->where('packages.0.name', $package->name)
                ->where('packages.0.checkout.applied_credit', 500000)
                ->where('packages.0.checkout.final_amount', 400000)
                ->where('packages.0.checkout.is_eligible', true));
    }

    public function test_package_checkout_rejects_incomplete_and_expired_credit(): void
    {
        [$patient] = $this->createCompletedConsultationCreditFixture(completed: false);
        $package = $this->createPackage();

        $this->actingAs($patient)
            ->postJson(route('payments.packages.init'), ['package_id' => $package->id])
            ->assertStatus(422);

        $this->assertSame(0, Payment::query()->where('type', 'package')->count());

        [$expiredPatient] = $this->createCompletedConsultationCreditFixture(expiresAt: now()->subMinute());

        $this->actingAs($expiredPatient)
            ->postJson(route('payments.packages.init'), ['package_id' => $package->id])
            ->assertStatus(422);

        $this->assertSame(0, Payment::query()->where('type', 'package')->count());
    }

    public function test_funded_package_settlement_consumes_credit_activates_entitlement_and_queues_notification(): void
    {
        Queue::fake([SendUserPackageNotificationJob::class]);

        [$patient] = $this->createCompletedConsultationCreditFixture();
        $package = $this->createPackage(price: 900000, credits: 4, name: 'Recovery Plan');

        $paymentId = $this->actingAs($patient)
            ->postJson(route('payments.packages.init'), ['package_id' => $package->id])
            ->assertOk()
            ->json('data.payment.id');

        $payment = Payment::query()->findOrFail($paymentId);

        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        $this->postJson(route('payments.webhook'), $this->validMidtransPayload($payment, 'settlement'))
            ->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'paid',
            'type' => 'package',
            'package_id' => $package->id,
            'consultation_credit_applied' => 500000,
            'amount' => 400000,
        ]);
        $this->assertDatabaseHas('user_packages', [
            'user_id' => $patient->id,
            'package_id' => $package->id,
            'payment_id' => $payment->id,
            'status' => 'active',
        ]);

        $patient->refresh();
        $this->assertSame(0, $patient->consultation_credit);
        $this->assertNotNull($patient->consultation_credit_consumed_at);

        Queue::assertPushed(SendUserPackageNotificationJob::class, 1);
    }

    public function test_zero_balance_package_checkout_activates_immediately_and_queues_notification(): void
    {
        Queue::fake([SendUserPackageNotificationJob::class]);

        [$patient] = $this->createCompletedConsultationCreditFixture();
        $package = $this->createPackage(price: 450000, credits: 2, name: 'Starter Package');

        $response = $this->actingAs($patient)
            ->postJson(route('payments.packages.init'), ['package_id' => $package->id])
            ->assertOk();

        $paymentId = $response->json('data.payment.id');

        $response
            ->assertJsonPath('data.payment.status', 'paid')
            ->assertJsonPath('data.payment.amount', 0)
            ->assertJsonPath('data.payment.consultation_credit_applied', 450000)
            ->assertJsonPath('data.user_package.status', 'active');

        $this->assertDatabaseHas('payments', [
            'id' => $paymentId,
            'type' => 'package',
            'provider' => 'internal',
            'status' => 'paid',
        ]);
        $this->assertDatabaseHas('user_packages', [
            'user_id' => $patient->id,
            'package_id' => $package->id,
            'payment_id' => $paymentId,
        ]);

        Queue::assertPushed(SendUserPackageNotificationJob::class, 1);
    }

    public function test_duplicate_package_webhooks_do_not_repeat_activation_side_effects(): void
    {
        Queue::fake([SendUserPackageNotificationJob::class]);

        [$patient] = $this->createCompletedConsultationCreditFixture();
        $package = $this->createPackage(price: 800000, credits: 3, name: 'Balance Package');

        $paymentId = $this->actingAs($patient)
            ->postJson(route('payments.packages.init'), ['package_id' => $package->id])
            ->assertOk()
            ->json('data.payment.id');

        $payment = Payment::query()->findOrFail($paymentId);
        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);
        $payload = $this->validMidtransPayload($payment, 'settlement');

        $this->postJson(route('payments.webhook'), $payload)->assertOk();
        $this->postJson(route('payments.webhook'), $payload)->assertOk();

        $this->assertSame(1, Payment::query()->whereKey($payment->id)->where('status', 'paid')->count());
        $this->assertSame(1, $patient->fresh()->userPackages()->where('payment_id', $payment->id)->count());

        Queue::assertPushed(SendUserPackageNotificationJob::class, 1);
    }

    public function test_failed_package_payment_preserves_consultation_credit_and_does_not_activate_entitlement(): void
    {
        [$patient] = $this->createCompletedConsultationCreditFixture();
        $package = $this->createPackage(price: 850000, credits: 3, name: 'Restore Package');

        $paymentId = $this->actingAs($patient)
            ->postJson(route('payments.packages.init'), ['package_id' => $package->id])
            ->assertOk()
            ->json('data.payment.id');

        $payment = Payment::query()->findOrFail($paymentId);

        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        $this->postJson(route('payments.webhook'), $this->validMidtransPayload($payment, 'expire'))
            ->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'failed',
        ]);
        $this->assertSame(500000, $patient->fresh()->consultation_credit);
        $this->assertNull($patient->fresh()->consultation_credit_consumed_at);
        $this->assertSame(0, $patient->fresh()->userPackages()->count());
    }

    public function test_successful_payment_confirmation_generates_meeting_access_before_queueing_notifications(): void
    {
        Queue::fake([SendBookingNotificationJob::class]);

        config([
            'midtrans.server_key' => 'server-key',
            'midtrans.client_key' => 'client-key',
        ]);

        $this->mock(MeetingLinkService::class, function ($mock): void {
            $mock->shouldReceive('ensureJoinableForBooking')
                ->once()
                ->andReturn('https://meet.example.test/consult-room');
        });

        [, , , $slot, $booking, $payment] = $this->createPendingBookingFixture();

        $this->postJson(route('payments.webhook'), $this->validMidtransPayload($payment, 'settlement'))
            ->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'paid',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
            'meeting_link' => 'https://meet.example.test/consult-room',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'booked',
        ]);

        Queue::assertPushed(SendBookingNotificationJob::class, 1);
    }

    public function test_paid_checkout_replaces_legacy_google_meet_links_with_joinable_room_urls(): void
    {
        $patient = User::factory()->create(['role' => 'patient']);
        [, $doctor] = $this->createDoctor();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'meeting_link' => 'https://meet.google.com/abc-defg-hij',
        ]);
        $payment = Payment::create([
            'user_id' => $patient->id,
            'booking_id' => $booking->id,
            'attempt_number' => 1,
            'type' => 'consultation',
            'amount' => 500000,
            'provider' => 'midtrans',
            'midtrans_order_id' => 'CONSULT-'.$booking->id.'-PAID',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $expectedLink = 'https://meet.jit.si/more-clinic-booking-'.$booking->id.'-doctor-'.$doctor->id.'-patient-'.$patient->id;

        $this->actingAs($patient)
            ->get(route('patient.checkout', $booking))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/Checkout')
                ->where('booking.id', $booking->id)
                ->where('booking.meeting_link', $expectedLink)
                ->where('payment.id', $payment->id));

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'meeting_link' => $expectedLink,
        ]);
    }

    public function test_local_payment_simulations_follow_server_side_payment_transitions(): void
    {
        Queue::fake([SendBookingNotificationJob::class]);

        [$patient, , , $slot, $booking, $payment] = $this->createPendingBookingFixture();

        $this->actingAs($patient)
            ->post(route('payments.simulate', $payment), ['status' => 'pending'])
            ->assertRedirect(route('patient.checkout', $booking));

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'locked',
        ]);

        [$secondPatient, , , $failedSlot, $failedBooking, $failedPayment] = $this->createPendingBookingFixture();

        $this->actingAs($secondPatient)
            ->post(route('payments.simulate', $failedPayment), ['status' => 'failed'])
            ->assertRedirect(route('patient.checkout', $failedBooking));

        $this->assertDatabaseHas('payments', [
            'id' => $failedPayment->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $failedBooking->id,
            'status' => 'cancelled',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $failedSlot->id,
            'status' => 'available',
        ]);

        [$thirdPatient, , , $successSlot, $successBooking, $successPayment] = $this->createPendingBookingFixture();

        $this->actingAs($thirdPatient)
            ->post(route('payments.simulate', $successPayment), ['status' => 'success'])
            ->assertRedirect(route('patient.checkout', $successBooking));

        $this->assertDatabaseHas('payments', [
            'id' => $successPayment->id,
            'status' => 'paid',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $successBooking->id,
            'status' => 'confirmed',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $successSlot->id,
            'status' => 'booked',
        ]);

        Queue::assertPushed(SendBookingNotificationJob::class, 1);
    }

    public function test_confirmation_notification_messages_include_consultation_access_details(): void
    {
        [, $doctor] = $this->createDoctor();
        $patient = User::factory()->create(['role' => 'patient']);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(14, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
            'meeting_link' => 'https://meet.example.test/join-room',
        ]);

        $this->mock(EmailNotificationService::class, function ($mock) use ($booking): void {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(function (?string $email, string $subject, string $message) use ($booking): bool {
                    return $email === $booking->patient->email
                        && $subject === 'Your consultation is confirmed'
                        && str_contains($message, $booking->meeting_link)
                        && str_contains($message, $booking->doctor->user->name);
                });
        });

        $this->mock(WhatsAppService::class, function ($mock) use ($booking): void {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(function (?string $phone, string $message) use ($booking): bool {
                    return $phone === $booking->patient->phone
                        && str_contains($message, $booking->meeting_link)
                        && str_contains($message, $booking->doctor->user->name);
                });
        });

        (new SendBookingNotificationJob($booking, 'confirmation'))->handle(
            app(EmailNotificationService::class),
            app(WhatsAppService::class),
        );
    }

    public function test_completion_follow_up_notifications_prompt_package_selection(): void
    {
        [, $doctor] = $this->createDoctor();
        $patient = User::factory()->create(['role' => 'patient']);
        $package = Package::create([
            'name' => 'Calm Skin Recovery',
            'slug' => 'calm-skin-recovery',
            'price' => 750000,
            'consultation_credits' => 2,
            'is_active' => true,
        ]);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(14, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'completed',
        ]);

        Consultation::create([
            'booking_id' => $booking->id,
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'recommended_package_id' => $package->id,
            'notes' => 'Consultation complete.',
            'completed_at' => now(),
        ]);

        $this->mock(EmailNotificationService::class, function ($mock) use ($booking, $package): void {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(function (?string $email, string $subject, string $message) use ($booking, $package): bool {
                    return $email === $booking->patient->email
                        && $subject === 'Your consultation is complete'
                        && str_contains($message, 'continue to package selection')
                        && str_contains($message, $package->name);
                });
        });

        $this->mock(WhatsAppService::class, function ($mock) use ($booking, $package): void {
            $mock->shouldReceive('send')
                ->once()
                ->withArgs(function (?string $phone, string $message) use ($booking, $package): bool {
                    return $phone === $booking->patient->phone
                        && str_contains($message, 'continue to package selection')
                        && str_contains($message, $package->name);
                });
        });

        (new SendBookingNotificationJob($booking, 'completion-follow-up'))->handle(
            app(EmailNotificationService::class),
            app(WhatsAppService::class),
        );
    }

    public function test_expired_slot_locks_are_released_with_related_pending_records(): void
    {
        [, , , $slot, $booking, $payment] = $this->createPendingBookingFixture(false);

        $slot->update([
            'locked_until' => now()->subMinute(),
        ]);

        $releasedCount = app(TimeSlotService::class)->releaseExpiredLocks();

        $this->assertSame(1, $releasedCount);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'cancelled',
        ]);
        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'available',
        ]);
    }

    public function test_second_patient_cannot_lock_slot_held_by_another_patient(): void
    {
        $firstPatient = User::factory()->create(['role' => 'patient']);
        $secondPatient = User::factory()->create(['role' => 'patient']);
        [, $doctor] = $this->createDoctor();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0));

        $this->actingAs($firstPatient)
            ->postJson(route('slots.lock'), ['slot_id' => $slot->id])
            ->assertOk();

        $this->actingAs($secondPatient)
            ->postJson(route('slots.lock'), ['slot_id' => $slot->id])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This slot is temporarily locked by another patient.');

        $this->assertDatabaseHas('time_slots', [
            'id' => $slot->id,
            'status' => 'locked',
            'locked_by_user_id' => $firstPatient->id,
        ]);
    }

    public function test_booking_confirmation_reuses_pending_booking_for_valid_patient_lock_and_redirects_to_checkout(): void
    {
        [$patient, , $doctor, $slot, $booking] = $this->createPendingBookingFixture();

        $response = $this->actingAs($patient)
            ->post(route('bookings.store'), [
                'doctor_id' => $doctor->id,
                'slot_id' => $slot->id,
                'notes' => 'Updated context before checkout.',
            ]);

        $response->assertRedirect(route('patient.checkout', $booking));

        $this->assertSame(1, Booking::query()->where('slot_id', $slot->id)->count());
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'pending',
        ]);
        $this->assertTrue($slot->fresh()->locked_until?->isFuture());
    }

    public function test_reminder_service_queues_day_before_and_same_day_notifications(): void
    {
        Queue::fake([SendBookingNotificationJob::class]);

        [, $doctor] = $this->createDoctor();
        $patient = User::factory()->create(['role' => 'patient']);

        $dayBeforeSlot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');
        $sameDaySlot = $this->createSlot(
            $doctor,
            now()->addMinutes((int) config('clinic.reminders.same_day_lead_minutes', 180) + 5),
            'booked',
        );

        $dayBeforeBooking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $dayBeforeSlot->id,
            'status' => 'confirmed',
        ]);

        $sameDayBooking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $sameDaySlot->id,
            'status' => 'confirmed',
        ]);

        $service = app(BookingReminderService::class);

        $this->assertSame(1, $service->queueDayBeforeReminders());
        $this->assertSame(1, $service->queueSameDayReminders());

        $this->assertNotNull($dayBeforeBooking->fresh()->day_before_reminder_sent_at);
        $this->assertNotNull($sameDayBooking->fresh()->same_day_reminder_sent_at);

        Queue::assertPushed(SendBookingNotificationJob::class, 2);
        Queue::assertPushed(SendBookingNotificationJob::class, fn (SendBookingNotificationJob $job) => $job->type === 'day-before-reminder');
        Queue::assertPushed(SendBookingNotificationJob::class, fn (SendBookingNotificationJob $job) => $job->type === 'same-day-reminder');
    }

    public function test_storage_flows_use_the_configured_clinic_asset_disk(): void
    {
        Storage::fake('clinic-assets');
        config(['clinic.asset_disk' => 'clinic-assets']);

        $patient = User::factory()->create(['role' => 'patient']);
        [$doctorUser, $doctor] = $this->createDoctor();
        $package = Package::create([
            'name' => 'Reset Package',
            'slug' => 'reset-package',
            'price' => 500000,
            'consultation_credits' => 2,
            'is_active' => true,
        ]);

        $slot = $this->createSlot($doctor, now()->addDay()->setTime(11, 0), 'booked');
        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'confirmed',
        ]);

        $this->actingAs($patient)
            ->from(route('patient.dashboard'))
            ->post(route('bookings.upload', $booking), [
                'document' => UploadedFile::fake()->create('lab-results.pdf', 128, 'application/pdf'),
            ])
            ->assertRedirect(route('patient.dashboard'));

        $booking->refresh();

        $this->assertNotNull($booking->patient_upload_path);
        Storage::disk('clinic-assets')->assertExists($booking->patient_upload_path);

        $this->actingAs($doctorUser)
            ->from(route('doctor.dashboard'))
            ->post(route('doctor.bookings.complete', $booking), [
                'notes' => 'Focus on hydration and sleep quality.',
                'recommended_package_id' => $package->id,
                'meal_plan_summary' => "Morning hydration\nBalanced lunch\nProtein-focused dinner",
            ])
            ->assertRedirect(route('doctor.consultations.index'));

        $booking->refresh();
        $consultation = $booking->consultation()->first();

        $this->assertSame('completed', $booking->status);
        $this->assertNotNull($consultation);
        $this->assertNotNull($consultation?->meal_plan_pdf_path);
        Storage::disk('clinic-assets')->assertExists($consultation->meal_plan_pdf_path);
    }

    /**
     * @return array{0: User, 1: Doctor}
     */
    private function createDoctor(int $consultationFee = 500000): array
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => $consultationFee,
            'is_active' => true,
        ]);

        return [$doctorUser, $doctor];
    }

    private function createSlot(Doctor $doctor, Carbon $startTime, string $status = 'available', ?User $lockedBy = null): TimeSlot
    {
        return TimeSlot::create([
            'doctor_id' => $doctor->id,
            'start_time' => $startTime,
            'end_time' => $startTime->copy()->addMinutes(30),
            'status' => $status,
            'locked_by_user_id' => $lockedBy?->id,
            'locked_until' => $lockedBy ? now()->addMinutes(15) : null,
        ]);
    }

    /**
     * @return array{0: User, 1: User, 2: Doctor, 3: TimeSlot, 4: Booking, 5: Payment}
     */
    private function createPendingBookingFixture(bool $futureLock = true, int $consultationFee = 500000): array
    {
        $patient = User::factory()->create(['role' => 'patient']);
        [$doctorUser, $doctor] = $this->createDoctor($consultationFee);
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(9, 0), 'locked', $patient);

        if (! $futureLock) {
            $slot->update(['locked_until' => now()->subMinute()]);
        }

        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => 'pending',
        ]);

        $payment = Payment::create([
            'user_id' => $patient->id,
            'booking_id' => $booking->id,
            'attempt_number' => 1,
            'amount' => $doctor->consultation_fee,
            'provider' => 'midtrans',
            'midtrans_order_id' => 'CONSULT-'.$booking->id.'-ABC123',
            'status' => 'pending',
        ]);

        return [$patient, $doctorUser, $doctor, $slot->fresh(), $booking, $payment];
    }

    private function createPackage(int $price = 900000, int $credits = 3, string $name = 'Glow Reset'): Package
    {
        return Package::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'price' => $price,
            'consultation_credits' => $credits,
            'is_active' => true,
        ]);
    }

    /**
     * @return array{0: User, 1: Doctor, 2: Booking, 3: Payment}
     */
    private function createCompletedConsultationCreditFixture(bool $completed = true, ?Carbon $expiresAt = null): array
    {
        $patient = User::factory()->create(['role' => 'patient']);
        [, $doctor] = $this->createDoctor();
        $slot = $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked');

        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $slot->id,
            'status' => $completed ? 'completed' : 'confirmed',
            'meeting_link' => 'https://meet.example.test/package-credit',
        ]);

        $payment = Payment::create([
            'user_id' => $patient->id,
            'booking_id' => $booking->id,
            'attempt_number' => 1,
            'type' => 'consultation',
            'amount' => 500000,
            'provider' => 'midtrans',
            'midtrans_order_id' => 'CONSULT-'.$booking->id.'-PKG01',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        if ($completed) {
            Consultation::create([
                'booking_id' => $booking->id,
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'notes' => 'Completed consultation for package checkout eligibility.',
                'completed_at' => now(),
            ]);
        }

        $patient->update([
            'consultation_credit' => 500000,
            'consultation_credit_awarded_at' => now(),
            'consultation_credit_expires_at' => $expiresAt ?? now()->addDays(30),
            'consultation_credit_consumed_at' => null,
            'consultation_credit_payment_id' => $payment->id,
        ]);

        return [$patient, $doctor, $booking, $payment];
    }

    /**
     * @return array<string, string>
     */
    private function validMidtransPayload(Payment $payment, string $transactionStatus): array
    {
        $grossAmount = (string) $payment->amount;
        $statusCode = '200';

        return [
            'order_id' => $payment->midtrans_order_id,
            'transaction_status' => $transactionStatus,
            'gross_amount' => $grossAmount,
            'status_code' => $statusCode,
            'signature_key' => hash('sha512', $payment->midtrans_order_id.$statusCode.$grossAmount.config('midtrans.server_key')),
        ];
    }
}
