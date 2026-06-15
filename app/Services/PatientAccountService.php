<?php

namespace App\Services;

use App\Jobs\SendPatientAccountCreatedJob;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PatientAccountService
{
    public function normalizePhone(?string $phone): ?string
    {
        if (blank($phone)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', (string) $phone) ?: '';

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        return $digits;
    }

    public function temporaryPasswordForPhone(string $phone): string
    {
        $digits = $this->normalizePhone($phone) ?? '';

        return 'More'.str_pad(substr($digits, -4), 4, '0', STR_PAD_LEFT).'!';
    }

    public function emailForPhone(string $phone): string
    {
        $digits = $this->normalizePhone($phone) ?? Str::random(10);

        return 'patient+'.$digits.'@more.local';
    }

    public function findPatientByPhone(?string $phone): ?User
    {
        $normalizedPhone = $this->normalizePhone($phone);

        if (! $normalizedPhone) {
            return null;
        }

        return User::query()
            ->where('role', 'patient')
            ->where('phone', $normalizedPhone)
            ->first();
    }

    public function provision(array $attributes, bool $sendNotification = true): User
    {
        $normalizedPhone = $this->normalizePhone($attributes['phone'] ?? null);

        if (! $normalizedPhone) {
            abort(422, 'A usable phone number is required for patient portal accounts.');
        }

        $existing = $this->findPatientByPhone($normalizedPhone);

        if ($existing) {
            return $existing;
        }

        $temporaryPassword = $this->temporaryPasswordForPhone($normalizedPhone);
        $email = filled($attributes['email'] ?? null)
            ? (string) $attributes['email']
            : $this->emailForPhone($normalizedPhone);

        $user = User::create([
            'name' => $attributes['name'],
            'email' => $email,
            'phone' => $normalizedPhone,
            'password' => Hash::make($temporaryPassword),
            'role' => 'patient',
            'email_verified_at' => now(),
            'must_change_password' => true,
            'date_of_birth' => $attributes['date_of_birth'] ?? null,
            'address' => $attributes['address'] ?? null,
            'medical_notes' => $attributes['medical_notes'] ?? null,
        ]);

        if ($sendNotification) {
            SendPatientAccountCreatedJob::dispatch($user->id, $temporaryPassword);
        }

        return $user;
    }
}
