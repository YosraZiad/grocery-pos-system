<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'category_id',
        'amount',
        'description',
        'date',
        'user_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * العلاقة مع قسم المصروفات
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id');
    }

    /**
     * العلاقة مع المستخدم
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
