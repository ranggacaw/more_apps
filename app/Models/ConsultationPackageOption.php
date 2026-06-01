<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConsultationPackageOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_family',
        'option_type',
        'name',
        'price',
        'injection_frequency',
        'duration_label',
        'duration_days',
        'requires_program_family',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'duration_days' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(ConsultationLineItem::class);
    }
}
