<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'doctor_id',
        'slot_id',
        'status',
        'notes',
        'meeting_link',
        'day_before_reminder_sent_at',
        'same_day_reminder_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'day_before_reminder_sent_at' => 'datetime',
            'same_day_reminder_sent_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
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
        return $this->hasOne(Payment::class);
    }
}
