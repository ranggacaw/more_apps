<?php

namespace Tests\Feature\Auth;

use App\Jobs\SendPatientOtpJob;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register_as_unverified_patients_and_queue_otp_delivery(): void
    {
        Queue::fake();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '620000000011',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'admin',
        ]);

        $user = User::where('email', 'test@example.com')->first();

        $this->assertAuthenticatedAs($user);
        $this->assertSame('patient', $user->role);
        $this->assertNull($user->email_verified_at);
        $this->assertNotNull($user->verification_otp);
        $this->assertNotNull($user->verification_otp_expires_at);
        $response->assertRedirect(route('verification.notice', absolute: false));

        Queue::assertPushed(SendPatientOtpJob::class);
    }

    public function test_registration_requires_valid_unique_fields(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
            'phone' => '620000000099',
        ]);

        $response = $this->from('/register')->post('/register', [
            'name' => '',
            'email' => 'existing@example.com',
            'phone' => '620000000099',
            'password' => 'password',
            'password_confirmation' => 'mismatch',
        ]);

        $response
            ->assertRedirect('/register')
            ->assertSessionHasErrors(['name', 'email', 'phone', 'password']);

        $this->assertGuest();
    }
}
