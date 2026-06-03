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
        'queue_entry_id',
        'user_id',
        'doctor_id',
        'recommended_package_id',
        'user_package_id',
        'notes',
        'slimming_weight_kg',
        'slimming_bmi',
        'slimming_vfa',
        'slimming_body_fat_percentage',
        'slimming_body_age',
        'slimming_muscle_mass',
        'slimming_upper_arm_cm',
        'slimming_waist_cm',
        'slimming_abdomen_cm',
        'slimming_hip_cm',
        'slimming_thigh_cm',
        'slimming_calf_cm',
        'slimming_metabolism_bmr',
        'slimming_anti_oxidant',
        'meal_plan_pdf_path',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'slimming_weight_kg' => 'float',
            'slimming_bmi' => 'float',
            'slimming_vfa' => 'float',
            'slimming_body_fat_percentage' => 'float',
            'slimming_body_age' => 'float',
            'slimming_muscle_mass' => 'float',
            'slimming_upper_arm_cm' => 'float',
            'slimming_waist_cm' => 'float',
            'slimming_abdomen_cm' => 'float',
            'slimming_hip_cm' => 'float',
            'slimming_thigh_cm' => 'float',
            'slimming_calf_cm' => 'float',
            'slimming_metabolism_bmr' => 'float',
            'slimming_anti_oxidant' => 'float',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function queueEntry(): BelongsTo
    {
        return $this->belongsTo(ClinicQueueEntry::class);
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
