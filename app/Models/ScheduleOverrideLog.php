<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleOverrideLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_user_id',
        'doctor_id',
        'booking_id',
        'slot_id',
        'override_date',
        'start_time',
        'end_time',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'override_date' => 'date',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class);
    }
}
