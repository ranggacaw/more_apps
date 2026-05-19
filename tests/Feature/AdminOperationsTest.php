<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Doctor;
use App\Models\EducationalContent;
use App\Models\Package;
use App\Models\Payment;
use App\Models\TimeSlot;
use App\Models\User;
use App\Models\UserPackage;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_doctor_cannot_access_new_admin_operations_routes(): void
    {
        [$doctorUser] = $this->createDoctorFixture();

        $this->actingAs($doctorUser)
            ->get(route('admin.users.index'))
            ->assertForbidden();
    }

    public function test_admin_dashboard_shows_kpis_and_recent_operational_activity(): void
    {
        $admin = $this->createAdmin();
        $patient = User::factory()->create(['role' => 'patient']);
        [$doctorUser, $doctor] = $this->createDoctorFixture();

        $booking = Booking::create([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'slot_id' => $this->createSlot($doctor, now()->addDay()->setTime(10, 0), 'booked')->id,
            'status' => 'confirmed',
        ]);

        Payment::create([
            'user_id' => $patient->id,
            'booking_id' => $booking->id,
            'attempt_number' => 1,
            'type' => 'consultation',
            'amount' => 500000,
            'provider' => 'midtrans',
            'midtrans_order_id' => 'consultation-'.$booking->id,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $package = Package::create([
            'name' => 'Reset Plan',
            'slug' => 'reset-plan',
            'description' => 'Structured follow-up care.',
            'price' => 900000,
            'duration_days' => 30,
            'type' => 'basic',
            'consultation_credits' => 3,
            'is_active' => true,
        ]);

        UserPackage::create([
            'user_id' => $patient->id,
            'package_id' => $package->id,
            'status' => 'active',
            'consultation_credits_total' => 3,
            'consultation_credits_remaining' => 2,
            'activated_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('stats.patients', 1)
                ->where('stats.doctors', 1)
                ->where('stats.admins', 1)
                ->where('stats.revenue', 500000)
                ->where('stats.confirmed_bookings', 1)
                ->where('stats.active_packages', 1)
                ->where('stats.active_entitlements', 1)
                ->has('recentBookings', 1)
                ->where('recentBookings.0.id', $booking->id)
                ->has('recentPayments', 1)
                ->where('recentPayments.0.type', 'consultation'));
    }

    public function test_admin_can_create_and_deactivate_packages_without_breaking_history(): void
    {
        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->post(route('admin.packages.store'), [
                'name' => 'VIP Recovery',
                'description' => 'Long-form guided care.',
                'price' => 1500000,
                'duration_days' => 60,
                'type' => 'vip',
                'consultation_credits' => 6,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('packages', [
            'name' => 'VIP Recovery',
            'duration_days' => 60,
            'type' => 'vip',
            'is_active' => true,
        ]);

        $patient = User::factory()->create(['role' => 'patient']);
        $historicalPackage = Package::create([
            'name' => 'Glow Reset',
            'slug' => 'glow-reset',
            'description' => 'Historical package.',
            'price' => 900000,
            'duration_days' => 30,
            'type' => 'basic',
            'consultation_credits' => 3,
            'is_active' => true,
        ]);
        $activeCatalogPackage = Package::create([
            'name' => 'Current Catalog Package',
            'slug' => 'current-catalog-package',
            'description' => 'Still purchasable.',
            'price' => 800000,
            'duration_days' => 30,
            'type' => 'advance',
            'consultation_credits' => 2,
            'is_active' => true,
        ]);

        $payment = Payment::create([
            'user_id' => $patient->id,
            'booking_id' => null,
            'package_id' => $historicalPackage->id,
            'attempt_number' => 1,
            'type' => 'package',
            'amount' => 400000,
            'consultation_credit_applied' => 500000,
            'provider' => 'midtrans',
            'midtrans_order_id' => 'package-historical-1',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        UserPackage::create([
            'user_id' => $patient->id,
            'package_id' => $historicalPackage->id,
            'payment_id' => $payment->id,
            'status' => 'active',
            'consultation_credits_total' => 3,
            'consultation_credits_remaining' => 2,
            'activated_at' => now(),
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.packages.update', $historicalPackage), [
                'name' => $historicalPackage->name,
                'description' => $historicalPackage->description,
                'price' => $historicalPackage->price,
                'duration_days' => $historicalPackage->duration_days,
                'type' => $historicalPackage->type,
                'consultation_credits' => $historicalPackage->consultation_credits,
                'is_active' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('packages', [
            'id' => $historicalPackage->id,
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'package_id' => $historicalPackage->id,
        ]);
        $this->assertDatabaseHas('user_packages', [
            'package_id' => $historicalPackage->id,
        ]);

        $this->actingAs($patient)
            ->get(route('patient.packages.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Patient/Packages')
                ->has('packages', 2)
                ->where('packages.0.id', $activeCatalogPackage->id)
                ->where('packages.1.id', $this->queryPackageByName('VIP Recovery')->id));
    }

    public function test_admin_reports_show_revenue_and_conversion_metrics_for_the_selected_window(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 5, 19, 9, 0));

        try {
            $admin = $this->createAdmin();
            $patient = User::factory()->create(['role' => 'patient']);
            [$doctorUser, $doctor] = $this->createDoctorFixture();
            $package = Package::create([
                'name' => 'Revenue Package',
                'slug' => 'revenue-package',
                'description' => 'For reporting.',
                'price' => 700000,
                'duration_days' => 30,
                'type' => 'advance',
                'consultation_credits' => 2,
                'is_active' => true,
            ]);

            $booking = Booking::create([
                'user_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'slot_id' => $this->createSlot($doctor, now()->addDay()->setTime(11, 0), 'booked')->id,
                'status' => 'confirmed',
            ]);

            Payment::create([
                'user_id' => $patient->id,
                'booking_id' => $booking->id,
                'attempt_number' => 1,
                'type' => 'consultation',
                'amount' => 500000,
                'provider' => 'midtrans',
                'midtrans_order_id' => 'report-consultation-1',
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $packagePayment = Payment::create([
                'user_id' => $patient->id,
                'booking_id' => null,
                'package_id' => $package->id,
                'attempt_number' => 1,
                'type' => 'package',
                'amount' => 700000,
                'provider' => 'midtrans',
                'midtrans_order_id' => 'report-package-1',
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            UserPackage::create([
                'user_id' => $patient->id,
                'package_id' => $package->id,
                'payment_id' => $packagePayment->id,
                'status' => 'active',
                'consultation_credits_total' => 2,
                'consultation_credits_remaining' => 2,
                'activated_at' => now(),
            ]);

            $this->actingAs($admin)
                ->get(route('admin.reports.index', [
                    'from' => '2026-05-01',
                    'to' => '2026-05-31',
                ]))
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Admin/Reports')
                    ->where('revenue.consultation_total', 500000)
                    ->where('revenue.package_total', 700000)
                    ->where('revenue.consultation_count', 1)
                    ->where('revenue.package_count', 1)
                    ->where('conversion.registered_users', 3)
                    ->where('conversion.verified_patients', 1)
                    ->where('conversion.consultation_bookings', 1)
                    ->where('conversion.paid_consultations', 1)
                    ->where('conversion.package_purchases', 1));
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_admin_broadcasts_validate_supported_scopes_and_store_delivery_audits(): void
    {
        config(['queue.default' => 'sync']);

        $admin = $this->createAdmin();
        $verifiedPatientA = User::factory()->create(['role' => 'patient', 'phone' => '628000000101']);
        $verifiedPatientB = User::factory()->create(['role' => 'patient', 'phone' => '628000000102']);
        $unverifiedPatient = User::factory()->unverified()->create(['role' => 'patient', 'phone' => '628000000103']);

        $this->actingAs($admin)
            ->post(route('admin.broadcasts.store'), [
                'audience_scope' => 'invalid',
                'message' => '',
            ])
            ->assertSessionHasErrors(['audience_scope', 'message']);

        $this->mock(WhatsAppService::class, function ($mock): void {
            $mock->shouldReceive('send')->twice();
        });

        $this->actingAs($admin)
            ->post(route('admin.broadcasts.store'), [
                'audience_scope' => 'verified_patients',
                'message' => 'Clinic update for verified patients.',
            ])
            ->assertRedirect();

        $broadcast = \App\Models\WhatsAppBroadcast::query()->firstOrFail();

        $this->assertDatabaseHas('whatsapp_broadcasts', [
            'id' => $broadcast->id,
            'audience_scope' => 'verified_patients',
            'recipient_count' => 2,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('whatsapp_broadcast_deliveries', [
            'whatsapp_broadcast_id' => $broadcast->id,
            'user_id' => $verifiedPatientA->id,
            'status' => 'sent',
        ]);
        $this->assertDatabaseHas('whatsapp_broadcast_deliveries', [
            'whatsapp_broadcast_id' => $broadcast->id,
            'user_id' => $verifiedPatientB->id,
            'status' => 'sent',
        ]);
        $this->assertDatabaseMissing('whatsapp_broadcast_deliveries', [
            'whatsapp_broadcast_id' => $broadcast->id,
            'user_id' => $unverifiedPatient->id,
        ]);
    }

    public function test_admin_can_publish_content_that_surfaces_on_the_home_page(): void
    {
        Storage::fake('public');
        config(['clinic.asset_disk' => 'public']);

        $admin = $this->createAdmin();

        $this->actingAs($admin)
            ->post(route('admin.content.store'), [
                'title' => 'Healthy Recovery Habits',
                'excerpt' => 'Simple habits after consultation.',
                'body' => 'Detailed educational guidance for patients.',
                'status' => 'published',
                'asset' => UploadedFile::fake()->image('habits.jpg'),
            ])
            ->assertRedirect();

        $content = EducationalContent::query()->firstOrFail();

        $this->assertSame('published', $content->status);
        $this->assertNotNull($content->asset_path);
        Storage::disk('public')->assertExists($content->asset_path);

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->has('featuredContent', 1)
                ->where('featuredContent.0.title', 'Healthy Recovery Habits'));
    }

    public function test_admin_can_filter_users_and_manage_doctor_provisioning_and_role_updates(): void
    {
        $admin = $this->createAdmin();
        $unverifiedPatient = User::factory()->unverified()->create([
            'role' => 'patient',
            'name' => 'Unverified Patient',
            'email' => 'unverified@example.com',
        ]);
        User::factory()->create([
            'role' => 'patient',
            'name' => 'Verified Patient',
            'email' => 'verified@example.com',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.users.index', [
                'role' => 'patient',
                'verification_state' => 'unverified',
            ]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Users')
                ->has('users', 1)
                ->where('users.0.id', $unverifiedPatient->id));

        $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'Dr. Provisioned',
                'email' => 'doctor-provisioned@example.com',
                'phone' => '628000000999',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'doctor',
                'is_verified' => true,
                'specialization' => 'Wellness',
                'consultation_fee' => 650000,
                'bio' => 'Provisioned by admin.',
                'doctor_is_active' => true,
            ])
            ->assertRedirect();

        $doctorUser = User::query()->where('email', 'doctor-provisioned@example.com')->firstOrFail();

        $this->assertDatabaseHas('users', [
            'id' => $doctorUser->id,
            'role' => 'doctor',
        ]);
        $this->assertDatabaseHas('doctors', [
            'user_id' => $doctorUser->id,
            'specialization' => 'Wellness',
            'consultation_fee' => 650000,
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.users.update', $unverifiedPatient), [
                'name' => $unverifiedPatient->name,
                'email' => $unverifiedPatient->email,
                'phone' => $unverifiedPatient->phone,
                'password' => '',
                'password_confirmation' => '',
                'role' => 'doctor',
                'is_verified' => true,
                'specialization' => 'Nutrition',
                'consultation_fee' => 550000,
                'bio' => 'Role updated by admin.',
                'doctor_is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $unverifiedPatient->id,
            'role' => 'doctor',
        ]);
        $this->assertDatabaseHas('doctors', [
            'user_id' => $unverifiedPatient->id,
            'specialization' => 'Nutrition',
            'consultation_fee' => 550000,
        ]);
        $this->assertNotNull($unverifiedPatient->fresh()->email_verified_at);
    }

    private function createAdmin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    /**
     * @return array{0: User, 1: Doctor}
     */
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

    private function queryPackageByName(string $name): Package
    {
        return Package::query()->where('name', $name)->firstOrFail();
    }
}
