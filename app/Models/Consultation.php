<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'user_id',
        'doctor_id',
        'recommended_package_id',
        'user_package_id',
        'notes',
        'meal_plan_pdf_path',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function recommendedPackage(): BelongsTo
    {
        return $this->belongsTo(Package::class, 'recommended_package_id');
    }

    public function userPackage(): BelongsTo
    {
        return $this->belongsTo(UserPackage::class);
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(ConsultationLineItem::class);
    }
}
