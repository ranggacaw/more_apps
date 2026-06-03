<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ClinicQueueEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'queue_number',
        'patient_name',
        'patient_phone',
        'complaint_notes',
        'doctor_id',
        'status',
        'queued_at',
        'assigned_at',
        'consultation_started_at',
        'completed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'queued_at' => 'datetime',
            'assigned_at' => 'datetime',
            'consultation_started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class, 'queue_entry_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'queue_entry_id');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['waiting', 'assigned', 'in_consultation']);
    }

    public static function generateNextQueueNumber(): string
    {
        $todayCount = self::whereDate('created_at', now()->toDateString())->count();
        return 'Q-' . str_pad($todayCount + 1, 3, '0', STR_PAD_LEFT);
    }
}
