<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id',
        'package_id',
        'attempt_number',
        'type',
        'amount',
        'return_amount',
        'hpp_amount',
        'consultation_credit_applied',
        'consultation_credit_source_payment_id',
        'provider',
        'midtrans_order_id',
        'snap_token',
        'status',
        'paid_at',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'amount' => 'integer',
            'return_amount' => 'integer',
            'hpp_amount' => 'integer',
            'consultation_credit_applied' => 'integer',
            'paid_at' => 'datetime',
            'payload' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function consultationCreditSourcePayment(): BelongsTo
    {
        return $this->belongsTo(self::class, 'consultation_credit_source_payment_id');
    }

    public function userPackage(): HasOne
    {
        return $this->hasOne(UserPackage::class);
    }
}
