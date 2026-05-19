<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Package extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'consultation_credits',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'consultation_credits' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function userPackages(): HasMany
    {
        return $this->hasMany(UserPackage::class);
    }

    public function recommendedConsultations(): HasMany
    {
        return $this->hasMany(Consultation::class, 'recommended_package_id');
    }
}
