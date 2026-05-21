<?php

namespace Tests\Feature\Auth;

use App\Jobs\SendPatientOtpJob;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_otp_verification_screen_can_be_rendered_for_unverified_patients(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get('/verify-otp');

        $response->assertStatus(200);
    }

    public function test_patient_can_be_verified_with_a_valid_otp(): void
    {
        $user = User::factory()->unverified()->create([
            'verification_otp' => bcrypt('123456'),
            'verification_otp_expires_at' => now()->addMinutes(10),
        ]);

        Event::fake();

        $response = $this->actingAs($user)->post(route('verification.otp.verify'), [
            'otp' => '123456',
        ]);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');
    }

    public function test_patient_is_not_verified_with_an_invalid_otp(): void
    {
        $user = User::factory()->unverified()->create([
            'verification_otp' => bcrypt('123456'),
            'verification_otp_expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->actingAs($user)->from('/verify-otp')->post(route('verification.otp.verify'), [
            'otp' => '654321',
        ]);

        $response
            ->assertRedirect('/verify-otp')
            ->assertSessionHasErrors('otp');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_patient_is_not_verified_with_an_expired_otp(): void
    {
        $user = User::factory()->unverified()->create([
            'verification_otp' => bcrypt('123456'),
            'verification_otp_expires_at' => now()->subMinute(),
        ]);

        $response = $this->actingAs($user)->from('/verify-otp')->post(route('verification.otp.verify'), [
            'otp' => '123456',
        ]);

        $response
            ->assertRedirect('/verify-otp')
            ->assertSessionHasErrors('otp');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_resending_patient_verification_queues_a_new_otp(): void
    {
        Queue::fake();

        $user = User::factory()->unverified()->create(['role' => 'patient']);

        $response = $this->actingAs($user)->post(route('verification.send'));

        $response
            ->assertRedirect()
            ->assertSessionHas('status', 'otp-sent')
            ->assertSessionHas('otp_debug_code');

        Queue::assertPushed(SendPatientOtpJob::class);
        $this->assertNotNull($user->fresh()->verification_otp);
    }

    public function test_otp_verification_screen_exposes_local_debug_context_when_whatsapp_is_logged(): void
    {
        $user = User::factory()->unverified()->create(['role' => 'patient']);

        $response = $this->actingAs($user)
            ->withSession([
                'status' => 'otp-sent',
                'otp_debug_code' => '123456',
            ])
            ->get('/verify-otp');

        $response
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/VerifyEmail')
                ->where('verificationChannel', 'otp')
                ->where('otpDeliveryMode', 'logged')
                ->where('otpDebugEnabled', true)
                ->where('otpDebugCode', '123456')
            );
    }

    public function test_patient_email_links_do_not_complete_verification(): void
    {
        $user = User::factory()->unverified()->create(['role' => 'patient']);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        $response->assertRedirect(route('verification.notice', absolute: false));
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }
}
