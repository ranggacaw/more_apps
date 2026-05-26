<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booked_by_admin_id',
        'doctor_id',
        'slot_id',
        'status',
        'booking_source',
        'consultation_mode',
        'guest_patient_name',
        'guest_whatsapp',
        'notes',
        'patient_upload_path',
        'meeting_link',
        'meeting_link_requested_at',
        'meeting_link_submitted_at',
        'day_before_reminder_sent_at',
        'same_day_reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'day_before_reminder_sent_at' => 'datetime',
            'same_day_reminder_sent_at' => 'datetime',
            'meeting_link_requested_at' => 'datetime',
            'meeting_link_submitted_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function bookedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'booked_by_admin_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class, 'slot_id');
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class);
    }

    public function isGuestBooking(): bool
    {
        return $this->booking_source === 'admin_assisted' && $this->user_id === null;
    }

    public function isAdminAssisted(): bool
    {
        return $this->booking_source === 'admin_assisted';
    }

    public function needsMeetingLink(): bool
    {
        return $this->isAdminAssisted()
            && $this->consultation_mode === 'online'
            && blank($this->meeting_link);
    }

    public function patientDisplayName(): string
    {
        if ($this->user_id && $this->patient) {
            return $this->patient->name;
        }

        return $this->guest_patient_name ?? 'Guest Patient';
    }

    public function patientContactPhone(): ?string
    {
        if ($this->user_id && $this->patient) {
            return $this->patient->phone;
        }

        return $this->guest_whatsapp;
    }

    public function patientContactEmail(): ?string
    {
        if ($this->user_id && $this->patient) {
            return $this->patient->email;
        }

        return null;
    }
}
