<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BalanceSheetEntry extends Model
{
    use HasFactory, SoftDeletes;

    public const SIDES = ['asset', 'equity', 'liability'];

    protected $fillable = [
        'side',
        'label',
        'category',
        'amount',
        'entry_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'entry_date' => 'date',
        ];
    }
}
