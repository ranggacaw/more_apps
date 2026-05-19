<?php

namespace App\Models;

use App\Notifications\ClinicVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'email_verified_at',
        'date_of_birth',
        'address',
        'medical_notes',
        'consultation_credit',
        'consultation_credit_awarded_at',
        'consultation_credit_expires_at',
        'consultation_credit_consumed_at',
        'consultation_credit_payment_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'verification_otp',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'verification_otp_expires_at' => 'datetime',
            'date_of_birth' => 'date',
            'consultation_credit' => 'integer',
            'consultation_credit_awarded_at' => 'datetime',
            'consultation_credit_expires_at' => 'datetime',
            'consultation_credit_consumed_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function doctorProfile(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function consultationCreditPayment(): HasOne
    {
        return $this->hasOne(Payment::class, 'id', 'consultation_credit_payment_id');
    }

    public function userPackages(): HasMany
    {
        return $this->hasMany(UserPackage::class);
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new ClinicVerifyEmail());
    }

    public function dashboardRoute(): string
    {
        return match ($this->role) {
            'doctor' => 'doctor.dashboard',
            'admin' => 'admin.dashboard',
            default => 'patient.dashboard',
        };
    }
}
