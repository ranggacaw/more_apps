<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsultationLineItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultation_id',
        'doctor_id',
        'aesthetic_program_id',
        'consultation_package_option_id',
        'type',
        'name',
        'quantity',
        'dosage_value',
        'dosage_unit',
        'unit_price',
        'hpp_amount',
        'line_total',
        'notes',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'dosage_value' => 'decimal:2',
            'unit_price' => 'integer',
            'hpp_amount' => 'integer',
            'line_total' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function aestheticProgram(): BelongsTo
    {
        return $this->belongsTo(AestheticProgram::class);
    }

    public function packageOption(): BelongsTo
    {
        return $this->belongsTo(ConsultationPackageOption::class, 'consultation_package_option_id');
    }
}
