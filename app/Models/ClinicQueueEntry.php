<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class ClinicQueueEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_type',
        'booking_id',
        'queue_date',
        'queue_sequence',
        'queue_number',
        'patient_name',
        'patient_phone',
        'complaint_notes',
        'doctor_id',
        'status',
        'queued_at',
        'assigned_at',
        'called_at',
        'consultation_started_at',
        'completed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'queue_date' => 'date',
            'queued_at' => 'datetime',
            'assigned_at' => 'datetime',
            'called_at' => 'datetime',
            'consultation_started_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
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
        $lastEntry = self::query()
            ->where('queue_date', now()->toDateString())
            ->whereNotNull('queue_sequence')
            ->orderByDesc('queue_sequence')
            ->first();

        return self::formatQueueNumber(((int) $lastEntry?->queue_sequence) + 1);
    }

    public static function createWithNextQueueNumber(array $attributes, ?CarbonInterface $queueDate = null): self
    {
        $queueDateString = ($queueDate ?? now())->toDateString();

        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                return DB::transaction(function () use ($attributes, $queueDateString): self {
                    $lastEntry = self::query()
                        ->where('queue_date', $queueDateString)
                        ->whereNotNull('queue_sequence')
                        ->orderByDesc('queue_sequence')
                        ->lockForUpdate()
                        ->first();

                    $sequence = ((int) $lastEntry?->queue_sequence) + 1;

                    return self::create([
                        'source_type' => 'walk_in',
                        'status' => 'waiting',
                        'queued_at' => now(),
                        ...$attributes,
                        'queue_date' => $queueDateString,
                        'queue_sequence' => $sequence,
                        'queue_number' => self::formatQueueNumber($sequence),
                    ]);
                });
            } catch (QueryException $exception) {
                if ($attempt === 3) {
                    throw $exception;
                }

                usleep(50000);
            }
        }

        throw new \RuntimeException('Unable to allocate a queue number.');
    }

    public static function formatQueueNumber(int $sequence): string
    {
        return 'Q-'.str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
    }
}
