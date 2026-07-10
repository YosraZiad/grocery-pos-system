<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shift extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'shift_number',
        'device_number',
        'opening_float',
        'closing_float',
        'opened_at',
        'closed_at',
        'status',
        'actual_cash',
        'actual_card',
        'expected_cash',
        'expected_card',
        'difference',
        'total_sales',
        'total_returns',
        'notes',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_float' => 'decimal:2',
        'closing_float' => 'decimal:2',
        'actual_cash' => 'decimal:2',
        'actual_card' => 'decimal:2',
        'expected_cash' => 'decimal:2',
        'expected_card' => 'decimal:2',
        'difference' => 'decimal:2',
        'total_sales' => 'decimal:2',
        'total_returns' => 'decimal:2',
    ];

    /**
     * الوردية تنتمي لمستخدم (كاشير)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
