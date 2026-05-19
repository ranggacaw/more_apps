<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class UserPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'package_id',
        'payment_id',
        'status',
        'consultation_credits_total',
        'consultation_credits_remaining',
        'activated_at',
        'expires_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'consultation_credits_total' => 'integer',
            'consultation_credits_remaining' => 'integer',
            'activated_at' => 'datetime',
            'expires_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    public function progressCheckIns(): HasMany
    {
        return $this->checkIns()->progress()->orderBy('program_week');
    }

    public function consultations(): HasMany
    {
        return $this->hasMany(Consultation::class);
    }

    public function sourceConsultation(): HasOne
    {
        return $this->hasOne(Consultation::class)->oldestOfMany('id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function currentProgramWeek(?Carbon $reference = null): int
    {
        $reference ??= now();
        $activatedAt = $this->activated_at ?? $this->created_at ?? $reference;

        return (int) floor($activatedAt->diffInDays($reference) / 7) + 1;
    }
}
