<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class CheckIn extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_package_id',
        'booking_id',
        'consultation_id',
        'user_id',
        'doctor_id',
        'program_week',
        'weight_kg',
        'waist_cm',
        'notes',
        'supporting_document_path',
        'progress_photo_path',
        'review_notes',
        'remaining_consultations_after',
        'checked_in_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'program_week' => 'integer',
            'weight_kg' => 'float',
            'waist_cm' => 'float',
            'remaining_consultations_after' => 'integer',
            'checked_in_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function scopeProgress(Builder $query): Builder
    {
        return $query->whereNotNull('program_week');
    }

    public function scopeOperational(Builder $query): Builder
    {
        return $query->whereNull('program_week');
    }

    public function userPackage(): BelongsTo
    {
        return $this->belongsTo(UserPackage::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }
}
