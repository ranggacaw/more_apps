<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AestheticProgram extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'price',
        'hpp_amount',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'hpp_amount' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(ConsultationLineItem::class);
    }
}
