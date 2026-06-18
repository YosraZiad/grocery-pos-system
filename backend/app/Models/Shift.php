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
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_float' => 'decimal:2',
        'closing_float' => 'decimal:2',
    ];

    /**
     * الوردية تنتمي لمستخدم (كاشير)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
